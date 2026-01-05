/**
 * Analogy Relationship Types
 * All 22 relationship types for verbal analogy questions
 *
 * Used for:
 * - Generating analogy questions with diverse relationships
 * - Validating relationship_type field in questions
 * - Displaying relationship labels in explanations (FR-026)
 *
 * @see specs/1-gat-exam-v3/data-model.md - AnalogyRelationship
 * @see User Story 5 (FR-025) - All 22 relationship types
 */

export interface AnalogyRelationship {
  /** Unique identifier (kebab-case) */
  id: string;
  /** Arabic name */
  nameAr: string;
  /** English name */
  nameEn: string;
  /** Brief definition */
  definition: string;
  /** Arabic example (word pair) */
  exampleAr: string;
  /** English translation of example */
  exampleEn: string;
}

/**
 * All 22 Analogy Relationship Types
 * Comprehensive list covering all common patterns in GAT exams
 */
export const ANALOGY_RELATIONSHIPS: readonly AnalogyRelationship[] = [
  // 1. Synonymy (ترادف)
  {
    id: 'synonymy',
    nameAr: 'ترادف',
    nameEn: 'Synonymy',
    definition: 'Words with the same or similar meaning',
    exampleAr: 'كبير : ضخم',
    exampleEn: 'Large : Huge',
  },

  // 2. Antonymy (تضاد)
  {
    id: 'antonymy',
    nameAr: 'تضاد',
    nameEn: 'Antonymy',
    definition: 'Words with opposite meanings',
    exampleAr: 'نور : ظلام',
    exampleEn: 'Light : Darkness',
  },

  // 3. Part-Whole (جزء من كل)
  {
    id: 'part-whole',
    nameAr: 'جزء من كل',
    nameEn: 'Part-Whole',
    definition: 'One is a component of the other',
    exampleAr: 'إصبع : يد',
    exampleEn: 'Finger : Hand',
  },

  // 4. Cause-Effect (سبب ونتيجة)
  {
    id: 'cause-effect',
    nameAr: 'سبب ونتيجة',
    nameEn: 'Cause-Effect',
    definition: 'One leads to or causes the other',
    exampleAr: 'جوع : ضعف',
    exampleEn: 'Hunger : Weakness',
  },

  // 5. Function-Object (وظيفة ومادة)
  {
    id: 'function-object',
    nameAr: 'وظيفة ومادة',
    nameEn: 'Function-Object',
    definition: 'The function or purpose of an object',
    exampleAr: 'قلم : كتابة',
    exampleEn: 'Pen : Writing',
  },

  // 6. Characteristic-Object (صفة وموصوف)
  {
    id: 'characteristic-object',
    nameAr: 'صفة وموصوف',
    nameEn: 'Characteristic-Object',
    definition: 'A quality or attribute of something',
    exampleAr: 'أبيض : ثلج',
    exampleEn: 'White : Snow',
  },

  // 7. Tool-Action (أداة وفعل)
  {
    id: 'tool-action',
    nameAr: 'أداة وفعل',
    nameEn: 'Tool-Action',
    definition: 'An instrument used to perform an action',
    exampleAr: 'مطرقة : دق',
    exampleEn: 'Hammer : Pound',
  },

  // 8. Degree-Intensity (درجة وشدة)
  {
    id: 'degree-intensity',
    nameAr: 'درجة وشدة',
    nameEn: 'Degree-Intensity',
    definition: 'Different levels or degrees of the same quality',
    exampleAr: 'حار : ملتهب',
    exampleEn: 'Hot : Scorching',
  },

  // 9. Category-Member (فئة وفرد)
  {
    id: 'category-member',
    nameAr: 'فئة وفرد',
    nameEn: 'Category-Member',
    definition: 'A member belongs to a category or class',
    exampleAr: 'فاكهة : تفاح',
    exampleEn: 'Fruit : Apple',
  },

  // 10. Location-Object (مكان وشيء)
  {
    id: 'location-object',
    nameAr: 'مكان وشيء',
    nameEn: 'Location-Object',
    definition: 'Where something is typically found or stored',
    exampleAr: 'مكتبة : كتاب',
    exampleEn: 'Library : Book',
  },

  // 11. Worker-Workplace (عامل ومكان عمل)
  {
    id: 'worker-workplace',
    nameAr: 'عامل ومكان عمل',
    nameEn: 'Worker-Workplace',
    definition: 'A person and their typical workplace',
    exampleAr: 'طبيب : مستشفى',
    exampleEn: 'Doctor : Hospital',
  },

  // 12. Worker-Tool (عامل وأداة)
  {
    id: 'worker-tool',
    nameAr: 'عامل وأداة',
    nameEn: 'Worker-Tool',
    definition: 'A person and their typical tool or instrument',
    exampleAr: 'نجار : منشار',
    exampleEn: 'Carpenter : Saw',
  },

  // 13. Material-Product (مادة ومنتج)
  {
    id: 'material-product',
    nameAr: 'مادة ومنتج',
    nameEn: 'Material-Product',
    definition: 'What something is made from',
    exampleAr: 'خشب : طاولة',
    exampleEn: 'Wood : Table',
  },

  // 14. Action-Object (فعل ومفعول)
  {
    id: 'action-object',
    nameAr: 'فعل ومفعول',
    nameEn: 'Action-Object',
    definition: 'An action and what it is performed on',
    exampleAr: 'قراءة : كتاب',
    exampleEn: 'Reading : Book',
  },

  // 15. Symbol-Meaning (رمز ومعنى)
  {
    id: 'symbol-meaning',
    nameAr: 'رمز ومعنى',
    nameEn: 'Symbol-Meaning',
    definition: 'A symbol and what it represents',
    exampleAr: 'حمامة : سلام',
    exampleEn: 'Dove : Peace',
  },

  // 16. Gender (جنس)
  {
    id: 'gender',
    nameAr: 'جنس',
    nameEn: 'Gender',
    definition: 'Male and female of the same species',
    exampleAr: 'ديك : دجاجة',
    exampleEn: 'Rooster : Hen',
  },

  // 17. Young-Adult (صغير وكبير)
  {
    id: 'young-adult',
    nameAr: 'صغير وكبير',
    nameEn: 'Young-Adult',
    definition: 'The young and mature form of the same thing',
    exampleAr: 'طفل : رجل',
    exampleEn: 'Child : Man',
  },

  // 18. Sequential-Order (ترتيب متسلسل)
  {
    id: 'sequential-order',
    nameAr: 'ترتيب متسلسل',
    nameEn: 'Sequential-Order',
    definition: 'Items in a sequence or progression',
    exampleAr: 'يناير : فبراير',
    exampleEn: 'January : February',
  },

  // 19. Whole-Part-Reverse (كل من جزء)
  {
    id: 'whole-part-reverse',
    nameAr: 'كل من جزء',
    nameEn: 'Whole-Part-Reverse',
    definition: 'The whole contains the part (reverse of part-whole)',
    exampleAr: 'سيارة : محرك',
    exampleEn: 'Car : Engine',
  },

  // 20. Lack-Need (نقص وحاجة)
  {
    id: 'lack-need',
    nameAr: 'نقص وحاجة',
    nameEn: 'Lack-Need',
    definition: 'A deficiency and what fulfills it',
    exampleAr: 'عطش : ماء',
    exampleEn: 'Thirst : Water',
  },

  // 21. Purpose-Result (هدف ونتيجة)
  {
    id: 'purpose-result',
    nameAr: 'هدف ونتيجة',
    nameEn: 'Purpose-Result',
    definition: 'An intended goal and its outcome',
    exampleAr: 'دراسة : نجاح',
    exampleEn: 'Study : Success',
  },

  // 22. Conversion (تحويل)
  {
    id: 'conversion',
    nameAr: 'تحويل',
    nameEn: 'Conversion',
    definition: 'Transformation from one form to another',
    exampleAr: 'ماء : بخار',
    exampleEn: 'Water : Steam',
  },
] as const;

/**
 * Map of relationship IDs to full relationship objects
 */
export const ANALOGY_RELATIONSHIP_MAP = new Map<string, AnalogyRelationship>(
  ANALOGY_RELATIONSHIPS.map(rel => [rel.id, rel])
);

/**
 * Get relationship by ID
 */
export function getAnalogyRelationship(id: string): AnalogyRelationship | undefined {
  return ANALOGY_RELATIONSHIP_MAP.get(id);
}

/**
 * Get all relationship IDs
 */
export function getAllAnalogyRelationshipIds(): string[] {
  return ANALOGY_RELATIONSHIPS.map(rel => rel.id);
}

/**
 * Get Arabic name for a relationship
 */
export function getAnalogyRelationshipNameAr(id: string): string {
  return ANALOGY_RELATIONSHIP_MAP.get(id)?.nameAr || id;
}

/**
 * Validate if a relationship ID is valid
 */
export function isValidAnalogyRelationship(id: string): boolean {
  return ANALOGY_RELATIONSHIP_MAP.has(id);
}

/**
 * Get random relationship for question generation
 */
export function getRandomAnalogyRelationship(): AnalogyRelationship {
  const randomIndex = Math.floor(Math.random() * ANALOGY_RELATIONSHIPS.length);
  return ANALOGY_RELATIONSHIPS[randomIndex];
}

/**
 * Get relationships by category (for balanced distribution)
 */
export const ANALOGY_RELATIONSHIP_CATEGORIES = {
  semantic: ['synonymy', 'antonymy', 'degree-intensity'],
  structural: ['part-whole', 'whole-part-reverse', 'category-member'],
  functional: ['function-object', 'tool-action', 'worker-tool', 'worker-workplace'],
  causal: ['cause-effect', 'purpose-result', 'lack-need'],
  descriptive: ['characteristic-object', 'symbol-meaning', 'material-product'],
  relational: ['gender', 'young-adult', 'sequential-order', 'location-object'],
  transformative: ['conversion', 'action-object'],
} as const;
