/**
 * Qudurat Skills Loader
 * 
 * هذا الملف يُستخدم لتحميل وإدارة الـ Skills في التطبيق
 * يدعم Prompt Caching لتوفير التكلفة
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ============================================
// Types
// ============================================

export type SkillName = 
  | 'qudurat-quant' 
  | 'qudurat-verbal' 
  | 'qudurat-diagrams' 
  | 'qudurat-schema' 
  | 'qudurat-quality';

export type ExamType = 'full' | 'quant-only' | 'verbal-only';

interface SkillContent {
  main: string;
  references: Record<string, string>;
}

// ============================================
// Skill Loader Class
// ============================================

class SkillLoader {
  private skills: Map<SkillName, SkillContent> = new Map();
  private loaded = false;
  private basePath: string;

  constructor(basePath: string = './src/skills') {
    this.basePath = basePath;
  }

  /**
   * تحميل جميع الـ Skills عند بدء التطبيق
   */
  async loadAll(): Promise<void> {
    if (this.loaded) return;

    const skillNames: SkillName[] = [
      'qudurat-quant',
      'qudurat-verbal',
      'qudurat-diagrams',
      'qudurat-schema',
      'qudurat-quality',
    ];

    for (const skillName of skillNames) {
      await this.loadSkill(skillName);
    }

    this.loaded = true;
    console.log(`✅ Loaded ${this.skills.size} skills successfully`);
  }

  /**
   * تحميل skill واحدة مع ملفات references
   */
  private async loadSkill(skillName: SkillName): Promise<void> {
    const skillPath = path.join(this.basePath, skillName);
    
    // تحميل SKILL.md الرئيسي
    const mainPath = path.join(skillPath, 'SKILL.md');
    const mainContent = await fs.promises.readFile(mainPath, 'utf-8');

    // تحميل ملفات references إن وجدت
    const references: Record<string, string> = {};
    const referencesPath = path.join(skillPath, 'references');
    
    if (fs.existsSync(referencesPath)) {
      const refFiles = await fs.promises.readdir(referencesPath);
      for (const file of refFiles) {
        if (file.endsWith('.md')) {
          const refPath = path.join(referencesPath, file);
          const refContent = await fs.promises.readFile(refPath, 'utf-8');
          references[file.replace('.md', '')] = refContent;
        }
      }
    }

    this.skills.set(skillName, { main: mainContent, references });
  }

  /**
   * الحصول على محتوى skill معينة
   */
  getSkill(skillName: SkillName): SkillContent | undefined {
    return this.skills.get(skillName);
  }

  /**
   * بناء System Prompt حسب نوع الامتحان
   */
  buildSystemPrompt(examType: ExamType, includeReferences: boolean = false): string {
    const parts: string[] = [];

    // دائماً نضيف schema و quality
    const schema = this.skills.get('qudurat-schema');
    const quality = this.skills.get('qudurat-quality');
    
    if (schema) parts.push(schema.main);
    if (quality) parts.push(quality.main);

    // إضافة حسب نوع الامتحان
    if (examType === 'full' || examType === 'quant-only') {
      const quant = this.skills.get('qudurat-quant');
      const diagrams = this.skills.get('qudurat-diagrams');
      
      if (quant) {
        parts.push(quant.main);
        if (includeReferences) {
          Object.values(quant.references).forEach(ref => parts.push(ref));
        }
      }
      if (diagrams) {
        parts.push(diagrams.main);
        if (includeReferences) {
          Object.values(diagrams.references).forEach(ref => parts.push(ref));
        }
      }
    }

    if (examType === 'full' || examType === 'verbal-only') {
      const verbal = this.skills.get('qudurat-verbal');
      
      if (verbal) {
        parts.push(verbal.main);
        if (includeReferences) {
          Object.values(verbal.references).forEach(ref => parts.push(ref));
        }
      }
    }

    return parts.join('\n\n---\n\n');
  }

  /**
   * الحصول على reference محددة
   */
  getReference(skillName: SkillName, refName: string): string | undefined {
    const skill = this.skills.get(skillName);
    return skill?.references[refName];
  }
}

// ============================================
// Claude API Service with Caching
// ============================================

interface GenerateOptions {
  examType: ExamType;
  track: 'scientific' | 'literary';
  section: 'quantitative' | 'verbal';
  batchNumber: number;
  totalBatches: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  topics?: string[];
  includeReferences?: boolean;
}

class QuduratGenerator {
  private anthropic: Anthropic;
  private skillLoader: SkillLoader;

  constructor(apiKey: string, skillsPath?: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.skillLoader = new SkillLoader(skillsPath);
  }

  async initialize(): Promise<void> {
    await this.skillLoader.loadAll();
  }

  async generateQuestions(options: GenerateOptions): Promise<any> {
    const {
      examType,
      track,
      section,
      batchNumber,
      totalBatches,
      difficulty,
      topics,
      includeReferences = false,
    } = options;

    // بناء System Prompt
    const systemPrompt = this.skillLoader.buildSystemPrompt(examType, includeReferences);

    // بناء User Message
    const userMessage = this.buildUserMessage(options);

    // إرسال الطلب مع Prompt Caching
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // ⭐ Prompt Caching
        },
      ],
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // استخراج JSON
    const content = response.content[0];
    if (content.type === 'text') {
      return this.extractJSON(content.text);
    }

    throw new Error('Unexpected response format');
  }

  private buildUserMessage(options: GenerateOptions): string {
    const { track, section, batchNumber, totalBatches, difficulty, topics } = options;

    let message = `أنشئ الدفعة ${batchNumber} من ${totalBatches} لامتحان القدرات.

المواصفات:
- المسار: ${track === 'scientific' ? 'العلمي' : 'الأدبي'}
- القسم: ${section === 'quantitative' ? 'الكمي' : 'اللفظي'}
- عدد الأسئلة: 20 سؤال
- الصعوبة: ${difficulty === 'mixed' ? '30% سهل، 50% متوسط، 20% صعب' : difficulty}
`;

    if (topics && topics.length > 0) {
      message += `- الموضوعات: ${topics.join('، ')}\n`;
    }

    message += `
أجب بتنسيق JSON فقط:
{
  "batchNumber": ${batchNumber},
  "totalBatches": ${totalBatches},
  "section": "${section}",
  "questions": [...]
}`;

    return message;
  }

  private extractJSON(text: string): any {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  }
}

// ============================================
// Exports
// ============================================

export { SkillLoader, QuduratGenerator };

// ============================================
// Usage Example
// ============================================

/*
// في ملف API route أو service

import { QuduratGenerator } from './skills';

// إنشاء المولد
const generator = new QuduratGenerator(process.env.ANTHROPIC_API_KEY!);

// تهيئة (مرة واحدة عند بدء السيرفر)
await generator.initialize();

// توليد أسئلة
const questions = await generator.generateQuestions({
  examType: 'full',
  track: 'scientific',
  section: 'quantitative',
  batchNumber: 1,
  totalBatches: 6,
  difficulty: 'mixed',
});

console.log(questions);
*/
