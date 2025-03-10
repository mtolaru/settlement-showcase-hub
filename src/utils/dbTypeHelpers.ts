
/**
 * This file contains type helper functions to work with Supabase
 * and handle TypeScript type safety issues.
 */

import { 
  safeStringParam, 
  safeNumberParam, 
  safeBooleanParam, 
  safeUpdateObj 
} from "@/integrations/supabase/client";

/**
 * Type-safe helper for string params in Supabase queries
 */
export const stringParam = (value: string) => safeStringParam(value);

/**
 * Type-safe helper for number params in Supabase queries
 */
export const numberParam = (value: number) => safeNumberParam(value);

/**
 * Type-safe helper for boolean params in Supabase queries
 */
export const booleanParam = (value: boolean) => safeBooleanParam(value);

/**
 * Type-safe helper for update objects in Supabase queries
 */
export const updateObj = <T extends Record<string, any>>(obj: T) => safeUpdateObj(obj);

/**
 * Safe accessor for query results to handle potential errors
 */
export const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] => {
  if (!obj) return defaultValue;
  
  try {
    // Handle Supabase query error objects
    if ('error' in obj && obj.error === true) {
      console.error('Error accessing query result:', obj);
      return defaultValue;
    }
    
    // Normal property access
    return obj[key] !== undefined ? obj[key] : defaultValue;
  } catch (err) {
    console.error(`Error accessing ${String(key)} on object:`, err);
    return defaultValue;
  }
};

/**
 * Type guard to check if an object is a SelectQueryError
 */
export const isQueryError = (obj: any): boolean => {
  return obj && (
    (typeof obj === 'object' && 'error' in obj && obj.error === true) ||
    (typeof obj === 'object' && 'code' in obj) ||
    (typeof obj === 'object' && 'message' in obj && 'details' in obj)
  );
};

/**
 * Safe data extractor that handles potential errors and provides default values
 */
export const extractData = <T>(data: any, defaultValue: T): T => {
  if (!data || isQueryError(data)) {
    return defaultValue;
  }
  return data as T;
};
