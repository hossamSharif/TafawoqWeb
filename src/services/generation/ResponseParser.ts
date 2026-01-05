/**
 * ResponseParser.ts
 * Parses and validates JSON responses from Claude API
 *
 * Features:
 * - Extracts JSON from Claude API responses
 * - Handles markdown code blocks and text wrapping
 * - Validates JSON structure
 * - Error recovery and helpful error messages
 *
 * @see specs/1-gat-exam-v3/plan.md - Response Parsing
 */

export interface ParsedResponse<T = any> {
  /** Parsed JSON data */
  data: T;
  /** Whether parsing was successful */
  success: boolean;
  /** Error message if parsing failed */
  error?: string;
  /** Raw text that was parsed */
  rawText: string;
  /** Whether response was in a code block */
  wasCodeBlock: boolean;
}

export class ResponseParser {
  /**
   * Parse Claude API response to extract JSON
   * @param responseText - Raw text from Claude API
   * @returns Parsed response with data or error
   */
  parse<T = any>(responseText: string): ParsedResponse<T> {
    const trimmed = responseText.trim();

    // Try multiple extraction strategies
    const extracted = this.extractJSON(trimmed);

    if (!extracted) {
      return {
        data: null as any,
        success: false,
        error: 'No valid JSON found in response',
        rawText: trimmed,
        wasCodeBlock: false,
      };
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(extracted.json);
      return {
        data,
        success: true,
        rawText: trimmed,
        wasCodeBlock: extracted.wasCodeBlock,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
        rawText: trimmed,
        wasCodeBlock: extracted.wasCodeBlock,
      };
    }
  }

  /**
   * Parse batch response (array of questions)
   * @param responseText - Raw text from Claude API
   * @returns Parsed array or error
   */
  parseBatch<T = any>(responseText: string): ParsedResponse<T[]> {
    const result = this.parse<T[]>(responseText);

    // Validate that result is an array
    if (result.success && !Array.isArray(result.data)) {
      // If single object returned, wrap in array
      if (typeof result.data === 'object' && result.data !== null) {
        return {
          ...result,
          data: [result.data],
        };
      }

      return {
        data: [],
        success: false,
        error: 'Expected array of questions but got non-array response',
        rawText: result.rawText,
        wasCodeBlock: result.wasCodeBlock,
      };
    }

    return result;
  }

  /**
   * Extract JSON from response text using multiple strategies
   */
  private extractJSON(text: string): { json: string; wasCodeBlock: boolean } | null {
    // Strategy 1: Try parsing the entire text as JSON
    if (this.looksLikeJSON(text)) {
      return { json: text, wasCodeBlock: false };
    }

    // Strategy 2: Extract from markdown code block ```json ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      const extracted = codeBlockMatch[1].trim();
      if (this.looksLikeJSON(extracted)) {
        return { json: extracted, wasCodeBlock: true };
      }
    }

    // Strategy 3: Extract from generic code block ``` ... ```
    const genericBlockMatch = text.match(/```\s*\n?([\s\S]*?)```/);
    if (genericBlockMatch) {
      const extracted = genericBlockMatch[1].trim();
      if (this.looksLikeJSON(extracted)) {
        return { json: extracted, wasCodeBlock: true };
      }
    }

    // Strategy 4: Find JSON object/array in text
    const jsonMatch = this.findJSONInText(text);
    if (jsonMatch) {
      return { json: jsonMatch, wasCodeBlock: false };
    }

    return null;
  }

  /**
   * Check if text looks like JSON (starts with { or [)
   */
  private looksLikeJSON(text: string): boolean {
    const trimmed = text.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }

  /**
   * Find JSON object or array within text
   * Handles cases where Claude adds explanation before/after JSON
   */
  private findJSONInText(text: string): string | null {
    // Try to find JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const extracted = objectMatch[0];
      try {
        JSON.parse(extracted); // Validate it's valid JSON
        return extracted;
      } catch {
        // Not valid JSON, continue
      }
    }

    // Try to find JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const extracted = arrayMatch[0];
      try {
        JSON.parse(extracted); // Validate it's valid JSON
        return extracted;
      } catch {
        // Not valid JSON
      }
    }

    return null;
  }

  /**
   * Extract multiple JSON objects from response
   * Useful if Claude returns multiple separate objects instead of array
   */
  parseMultiple<T = any>(responseText: string): ParsedResponse<T[]> {
    const trimmed = responseText.trim();
    const objects: T[] = [];

    // Try to parse as array first
    const arrayResult = this.parseBatch<T>(trimmed);
    if (arrayResult.success) {
      return arrayResult;
    }

    // Try to find multiple JSON objects
    const matches = trimmed.matchAll(/\{[\s\S]*?\}(?=\s*(?:\{|$))/g);

    for (const match of matches) {
      try {
        const obj = JSON.parse(match[0]);
        objects.push(obj);
      } catch {
        // Skip invalid JSON
        continue;
      }
    }

    if (objects.length > 0) {
      return {
        data: objects,
        success: true,
        rawText: trimmed,
        wasCodeBlock: false,
      };
    }

    return {
      data: [],
      success: false,
      error: 'Could not extract any valid JSON objects',
      rawText: trimmed,
      wasCodeBlock: false,
    };
  }

  /**
   * Validate that parsed data has required fields
   * @param data - Parsed data
   * @param requiredFields - Array of required field names
   * @returns Validation result
   */
  validateFields(
    data: any,
    requiredFields: string[]
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Clean response text before parsing
   * Removes common artifacts from Claude responses
   */
  cleanResponseText(text: string): string {
    let cleaned = text.trim();

    // Remove common prefixes
    cleaned = cleaned.replace(/^Here (is|are) the .*?:\s*/i, '');
    cleaned = cleaned.replace(/^I'll generate .*?:\s*/i, '');
    cleaned = cleaned.replace(/^Here's? .*?:\s*/i, '');

    // Remove trailing explanations
    cleaned = cleaned.replace(/\n\nI('ve| have) generated.*$/s, '');
    cleaned = cleaned.replace(/\n\nNote:.*$/s, '');

    return cleaned.trim();
  }

  /**
   * Format parse error for logging/debugging
   */
  formatError(response: ParsedResponse): string {
    if (response.success) {
      return 'No error';
    }

    let msg = `JSON Parsing Error: ${response.error}\n\n`;
    msg += `Raw response preview (first 500 chars):\n`;
    msg += `${response.rawText.slice(0, 500)}${response.rawText.length > 500 ? '...' : ''}\n`;

    if (response.rawText.length > 500) {
      msg += `\nFull response length: ${response.rawText.length} characters\n`;
    }

    return msg;
  }
}

/**
 * Singleton instance for convenient access
 */
export const responseParser = new ResponseParser();
