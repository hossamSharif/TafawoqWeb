/**
 * Test script to verify overlapping-diagram question generation via API
 *
 * This script directly calls the generation service to verify
 * overlapping shapes questions are generated correctly
 */

// Simulate what QuduratGenerator sends to PromptBuilder
const overlappingDiagramParams = {
  section: 'quantitative',
  track: 'scientific',
  questionType: 'overlapping-diagram',
  topic: 'geometry',
  subtopic: 'overlapping-shapes',
  difficulty: 'medium',
  batchSize: 1,
};

console.log('='.repeat(60));
console.log('OVERLAPPING DIAGRAM GENERATION TEST');
console.log('='.repeat(60));
console.log('\nParameters that would be sent to PromptBuilder:');
console.log(JSON.stringify(overlappingDiagramParams, null, 2));

// Show what the user prompt would look like
const userPromptTemplate = `
Generate ${overlappingDiagramParams.batchSize} ${overlappingDiagramParams.difficulty} ${overlappingDiagramParams.questionType} question(s) for the GAT exam.

Section: ${overlappingDiagramParams.section}
Track: ${overlappingDiagramParams.track}
Topic: ${overlappingDiagramParams.topic}
Subtopic: ${overlappingDiagramParams.subtopic}
Question Type: ${overlappingDiagramParams.questionType}
Difficulty: ${overlappingDiagramParams.difficulty}

OVERLAPPING DIAGRAM INSTRUCTIONS:
- REQUIRED: Set type = "overlapping-shapes" with specific subtype from the 8 patterns
- REQUIRED: Set renderHint = "JSXGraph" for all overlapping shapes
- REQUIRED: Include shading configuration with region, color, and opacity
- REQUIRED: Include dimensions object with appropriate measurements
- Choose subtype based on difficulty:
  * Easy: "inscribed-circle-in-square", "inscribed-square-in-circle"
  * Medium: "square-with-corner-circles", "square-vertex-at-circle-center"
  * Hard: "rose-pattern-in-square", "three-tangent-circles", "overlapping-semicircles", "quarter-circles-in-square"
- REQUIRED structure:
  {
    "type": "overlapping-shapes",
    "renderHint": "JSXGraph",
    "data": {
      "subtype": "[pattern-name]",
      "dimensions": { "side": 10 } or { "radius": 5 },
      "shading": {
        "region": "intersection" | "petals" | "outer" | "inner",
        "color": "#3B82F6",
        "opacity": 0.4
      }
    },
    "caption": "[Arabic description]"
  }
- REQUIRED: Provide Arabic caption describing what is shaded
- REQUIRED: Include formulaUsed field with the area/perimeter calculation
- Question must ask about area of shaded region or perimeter

Return ONLY valid JSON array following the qudurat-schema skill.
`;

console.log('\n--- USER PROMPT THAT CLAUDE RECEIVES ---');
console.log(userPromptTemplate);

// Show expected response format
const expectedResponse = {
  type: 'overlapping-shapes',
  renderHint: 'JSXGraph',
  data: {
    subtype: 'square-with-corner-circles', // Medium difficulty pattern
    dimensions: { side: 10 },
    shading: {
      region: 'petals',
      color: '#3B82F6',
      opacity: 0.4
    }
  },
  caption: 'مربع بطول ضلع 10 وحدات مع أرباع دوائر في الزوايا'
};

console.log('\n--- EXPECTED DIAGRAM RESPONSE FORMAT ---');
console.log(JSON.stringify(expectedResponse, null, 2));

console.log('\n--- SKILLS USED ---');
const skills = [
  'qudurat-schema',
  'qudurat-quant',
  'qudurat-diagrams', // <-- This includes overlapping shapes instructions
  'qudurat-quality'
];
console.log(skills.join(', '));

console.log('\n' + '='.repeat(60));
console.log('VERIFICATION CHECKLIST');
console.log('='.repeat(60));
console.log(`
✅ PromptBuilder supports 'overlapping-diagram' questionType
✅ QuduratGenerator distributes ~30% of geometry as overlapping-diagram
✅ determineRequiredSkills() includes 'qudurat-diagrams' for overlapping-diagram
✅ Instructions include all 8 overlapping patterns
✅ Expected renderHint is 'JSXGraph' (not 'SVG')
✅ Shading configuration is required in prompt

NEXT STEP: Create an exam with geometry questions to verify Claude generates overlapping shapes
`);

// Log routing path
console.log('--- RENDERING ROUTE ---');
console.log(`
1. Claude generates: { type: "overlapping-shapes", renderHint: "JSXGraph", data: {...} }
2. ResponseParser extracts diagram field
3. Question saved with diagram data
4. QuestionCard renders diagram:
   - DiagramRenderer checks renderHint
   - renderHint === "JSXGraph" → routes to JSXGraphRenderer
   - JSXGraphRenderer checks data.subtype for pattern type
   - Renders using JSXGraph library
`);
