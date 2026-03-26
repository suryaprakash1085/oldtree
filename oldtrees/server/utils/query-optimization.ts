import { query } from "../db";

/**
 * Utility functions for ultra-optimized queries
 * Prevents common performance antipatterns
 */

/**
 * Get paginated results with count in optimal way
 */
export async function getPaginatedResults<T>(
  tableName: string,
  tenantId: string,
  page: string | number = "1",
  limit: string | number = "10",
  whereClause: string = "tenant_id = ?",
  orderBy: string = "created_at DESC",
  params: any[] = [],
  selectColumns: string = "*"
): Promise<{ data: T[]; pagination: any }> {
  const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
  const pageLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
  const offset = (currentPage - 1) * pageLimit;

  const finalParams = [tenantId, ...params];

  // Optimized: Use LIMIT with OFFSET
  const data = await query(
    `SELECT ${selectColumns} FROM ${tableName} 
     WHERE ${whereClause} 
     ORDER BY ${orderBy} 
     LIMIT ? OFFSET ?`,
    [...finalParams, pageLimit, offset]
  );

  // Get count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM ${tableName} WHERE ${whereClause}`,
    finalParams
  );

  const total =
    Array.isArray(countResult) && countResult.length > 0
      ? (countResult[0] as any).total
      : 0;

  return {
    data: (Array.isArray(data) ? data : []) as T[],
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      pages: Math.ceil(total / pageLimit),
    },
  };
}

/**
 * Batch fetch related data efficiently
 */
export async function batchFetchRelated<T>(
  sql: string,
  ids: string[],
  additionalParams: any[] = []
): Promise<Map<string, T[]>> {
  if (ids.length === 0) {
    return new Map();
  }

  const placeholders = ids.map(() => "?").join(",");
  const finalSql = sql.replace("?", placeholders);
  const results = await query(finalSql, [...ids, ...additionalParams]);

  const resultMap = new Map<string, T[]>();
  if (Array.isArray(results)) {
    (results as any[]).forEach((row) => {
      const id = row.id || row.parent_id;
      if (!resultMap.has(id)) {
        resultMap.set(id, []);
      }
      resultMap.get(id)!.push(row);
    });
  }

  return resultMap;
}

/**
 * Aggregate query results with minimal overhead
 */
export async function getAggregates(
  tableName: string,
  tenantId: string,
  aggregations: Record<string, string>,
  whereClause: string = "tenant_id = ?"
): Promise<Record<string, any>> {
  const aggregateFields = Object.entries(aggregations)
    .map(([key, func]) => `${func} as ${key}`)
    .join(", ");

  const result = await query(
    `SELECT ${aggregateFields} FROM ${tableName} WHERE ${whereClause}`,
    [tenantId]
  );

  return Array.isArray(result) && result.length > 0 ? result[0] : {};
}

/**
 * Safe result extraction with defaults
 */
export function extractFirst<T>(results: any[], defaultValue?: T): T {
  return Array.isArray(results) && results.length > 0
    ? results[0]
    : defaultValue || null;
}

export function extractArray<T>(results: any[]): T[] {
  return Array.isArray(results) ? results : [];
}

export function extractCount(results: any[]): number {
  return Array.isArray(results) && results.length > 0
    ? results[0].total || results[0].count || 0
    : 0;
}

/**
 * Combine multiple counts efficiently
 */
export async function getCombinedCounts(
  tenantId: string,
  countQueries: Array<{ label: string; sql: string }>
): Promise<Record<string, number>> {
  const results = await Promise.all(
    countQueries.map((q) => query(q.sql, [tenantId]))
  );

  const counts: Record<string, number> = {};
  countQueries.forEach((q, index) => {
    counts[q.label] = extractCount(results[index]);
  });

  return counts;
}

/**
 * Optimize theme selection with fallback
 */
export async function getActiveThemeOptimized(
  tenantId: string
): Promise<any> {
  const result = await query(
    `SELECT t.* FROM themes t
     JOIN tenant_themes tt ON t.id = tt.theme_id
     WHERE tt.tenant_id = ?
     ORDER BY tt.is_active DESC, t.created_at ASC
     LIMIT 1`,
    [tenantId]
  );

  if (Array.isArray(result) && result.length > 0) {
    return result[0];
  }

  // Fallback: get first system theme
  const fallback = await query(
    "SELECT * FROM themes WHERE is_system_theme = TRUE ORDER BY created_at LIMIT 1",
    []
  );

  return Array.isArray(fallback) && fallback.length > 0 ? fallback[0] : null;
}

/**
 * Bulk operation handler
 */
export async function bulkUpdateStatus(
  tableName: string,
  ids: string[],
  status: string,
  statusColumn: string = "is_active"
): Promise<number> {
  if (ids.length === 0) return 0;

  const placeholders = ids.map(() => "?").join(",");
  const result = await query(
    `UPDATE ${tableName} SET ${statusColumn} = ? WHERE id IN (${placeholders})`,
    [status, ...ids]
  );

  return result as any;
}

/**
 * Check resource ownership before operations
 */
export async function verifyOwnership(
  tableName: string,
  resourceId: string,
  tenantId: string
): Promise<boolean> {
  const result = await query(
    `SELECT id FROM ${tableName} WHERE id = ? AND tenant_id = ? LIMIT 1`,
    [resourceId, tenantId]
  );

  return Array.isArray(result) && result.length > 0;
}

/**
 * Optimized search with proper indexes
 */
export async function searchWithPagination(
  tableName: string,
  tenantId: string,
  searchTerm: string,
  searchColumns: string[],
  page: number = 1,
  limit: number = 10
): Promise<{ data: any[]; pagination: any }> {
  const pageLimit = Math.min(100, Math.max(1, limit));
  const offset = (Math.max(1, page) - 1) * pageLimit;

  // Build search conditions
  const searchConditions = searchColumns
    .map((col) => `${col} LIKE ?`)
    .join(" OR ");

  const searchParams = searchColumns.map(() => `%${searchTerm}%`);

  const data = await query(
    `SELECT * FROM ${tableName}
     WHERE tenant_id = ? AND (${searchConditions})
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [tenantId, ...searchParams, pageLimit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM ${tableName}
     WHERE tenant_id = ? AND (${searchConditions})`,
    [tenantId, ...searchParams]
  );

  const total = extractCount(extractArray(countResult));

  return {
    data: extractArray(data),
    pagination: {
      total,
      page: Math.max(1, page),
      limit: pageLimit,
      pages: Math.ceil(total / pageLimit),
    },
  };
}

/**
 * Common pagination parse helper
 */
export function parsePagination(page?: any, limit?: any) {
  const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
  const pageLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
  const offset = (currentPage - 1) * pageLimit;

  return { currentPage, pageLimit, offset };
}

/**
 * Response wrapper for consistency
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export function formatDataResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}

export function formatErrorResponse(error: string, statusCode: number = 500) {
  return {
    statusCode,
    body: {
      success: false,
      error,
    },
  };
}
