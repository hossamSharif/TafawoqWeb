// Script to check diagram data in exam
const https = require('http');

const TOKEN = process.argv[2];
const SESSION_ID = process.argv[3] || 'f0d2042d-3364-4bf6-b93a-6a8a41a00107';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/exams/${SESSION_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const d = JSON.parse(data);
      console.log('=== EXAM DIAGRAM ANALYSIS ===');
      console.log('Session ID:', d.id);
      console.log('Total Questions:', d.questions?.length || 0);

      const diagramQs = (d.questions || []).filter(q =>
        q.questionType === 'diagram' || q.topic === 'geometry'
      );
      console.log('Diagram/Geometry questions:', diagramQs.length);

      diagramQs.forEach(q => {
        console.log('\n--- Question', q.index + 1, '---');
        console.log('  questionType:', q.questionType);
        console.log('  topic:', q.topic);
        console.log('  HAS DIAGRAM:', q.diagram ? 'YES' : 'NO');
        if (q.diagram) {
          console.log('  diagram.type:', q.diagram.type);
          console.log('  diagram.renderHint:', q.diagram.renderHint);
          console.log('  diagram.data:', JSON.stringify(q.diagram.data).slice(0, 150) + '...');
        }
      });

      // Summary
      const withDiagram = diagramQs.filter(q => q.diagram).length;
      console.log('\n=== SUMMARY ===');
      console.log('Questions with diagram data:', withDiagram, '/', diagramQs.length);
      if (withDiagram === 0) {
        console.log('WARNING: No diagram data found!');
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', data.slice(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
