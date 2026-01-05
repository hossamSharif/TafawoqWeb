/**
 * SkillLoader.ts
 * Service for loading and concatenating Skills files for AI prompt construction
 *
 * Skills Architecture:
 * - Each skill has a SKILL.md file with core rules and instructions
 * - A references/ subdirectory contains additional context files
 * - SkillLoader concatenates these into a single prompt string
 *
 * @see specs/1-gat-exam-v3/plan.md - Skills Architecture
 */

import fs from 'fs/promises';
import path from 'path';

export interface SkillContent {
  /** Name of the skill (directory name) */
  name: string;
  /** Content of SKILL.md */
  mainContent: string;
  /** Contents of all reference files */
  references: SkillReference[];
  /** Total concatenated content */
  fullContent: string;
  /** Estimated token count (rough approximation) */
  estimatedTokens: number;
}

export interface SkillReference {
  /** Filename of the reference */
  filename: string;
  /** Content of the reference file */
  content: string;
}

export class SkillLoader {
  private skillsBasePath: string;
  private cache: Map<string, SkillContent> = new Map();

  constructor(skillsBasePath?: string) {
    // Default to src/skills/ if not specified
    this.skillsBasePath = skillsBasePath || path.join(process.cwd(), 'src', 'skills');
  }

  /**
   * Load a skill by name
   * @param skillName - Name of the skill directory (e.g., 'qudurat-quant')
   * @param useCache - Whether to use cached content (default: true)
   * @returns SkillContent with concatenated content
   */
  async loadSkill(skillName: string, useCache: boolean = true): Promise<SkillContent> {
    // Check cache first
    if (useCache && this.cache.has(skillName)) {
      return this.cache.get(skillName)!;
    }

    const skillPath = path.join(this.skillsBasePath, skillName);

    // Verify skill directory exists
    try {
      await fs.access(skillPath);
    } catch (error) {
      throw new Error(`Skill directory not found: ${skillPath}`);
    }

    // Read SKILL.md
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let mainContent: string;
    try {
      mainContent = await fs.readFile(skillMdPath, 'utf-8');
    } catch (error) {
      throw new Error(`SKILL.md not found in ${skillPath}`);
    }

    // Read references/ directory
    const references = await this.loadReferences(skillPath);

    // Concatenate all content
    const fullContent = this.concatenateContent(skillName, mainContent, references);

    // Estimate token count (rough: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(fullContent.length / 4);

    const skillContent: SkillContent = {
      name: skillName,
      mainContent,
      references,
      fullContent,
      estimatedTokens,
    };

    // Cache the result
    this.cache.set(skillName, skillContent);

    return skillContent;
  }

  /**
   * Load multiple skills and concatenate them
   * @param skillNames - Array of skill names to load
   * @returns Combined SkillContent
   */
  async loadMultipleSkills(skillNames: string[]): Promise<SkillContent> {
    const skills = await Promise.all(
      skillNames.map(name => this.loadSkill(name))
    );

    // Combine all skills
    const mainContent = skills.map(s => s.mainContent).join('\n\n---\n\n');
    const references = skills.flatMap(s => s.references);
    const fullContent = this.concatenateMultipleSkills(skills);
    const estimatedTokens = skills.reduce((sum, s) => sum + s.estimatedTokens, 0);

    return {
      name: skillNames.join('+'),
      mainContent,
      references,
      fullContent,
      estimatedTokens,
    };
  }

  /**
   * Clear the cache (useful for development/testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get list of available skills
   */
  async listAvailableSkills(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.skillsBasePath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => !name.startsWith('.'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Load all reference files from a skill's references/ directory
   */
  private async loadReferences(skillPath: string): Promise<SkillReference[]> {
    const referencesPath = path.join(skillPath, 'references');

    // Check if references/ directory exists
    try {
      await fs.access(referencesPath);
    } catch (error) {
      // No references directory is OK
      return [];
    }

    // Read all .md files in references/
    const entries = await fs.readdir(referencesPath, { withFileTypes: true });
    const mdFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name);

    // Load each reference file
    const references: SkillReference[] = [];
    for (const filename of mdFiles) {
      const filepath = path.join(referencesPath, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      references.push({ filename, content });
    }

    return references;
  }

  /**
   * Concatenate skill content in the format expected by Claude API
   */
  private concatenateContent(
    skillName: string,
    mainContent: string,
    references: SkillReference[]
  ): string {
    let result = `# Skill: ${skillName}\n\n`;
    result += mainContent;

    if (references.length > 0) {
      result += '\n\n---\n\n# References\n\n';
      for (const ref of references) {
        result += `## ${ref.filename}\n\n`;
        result += ref.content;
        result += '\n\n---\n\n';
      }
    }

    return result;
  }

  /**
   * Concatenate multiple skills into a single prompt
   */
  private concatenateMultipleSkills(skills: SkillContent[]): string {
    let result = '# Skills System Prompt\n\n';
    result += 'You have access to the following specialized skills for question generation:\n\n';

    for (const skill of skills) {
      result += `## ${skill.name}\n\n`;
      result += skill.mainContent;
      result += '\n\n';

      if (skill.references.length > 0) {
        result += `### References for ${skill.name}\n\n`;
        for (const ref of skill.references) {
          result += `#### ${ref.filename}\n\n`;
          result += ref.content;
          result += '\n\n';
        }
      }

      result += '---\n\n';
    }

    return result;
  }
}

/**
 * Singleton instance for convenient access
 */
export const skillLoader = new SkillLoader();
