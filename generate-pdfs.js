#!/usr/bin/env node
/**
 * Generate PDFs with uncompressed content using standard fonts.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'products');

// Disable compression globally
PDFDocument.prototype._doCompress = function() { return false; };

function makePDF(title, contentLines, filename) {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 40, left: 50, right: 50 },
    compress: false
  });
  
  const outPath = path.join(outDir, filename);
  doc.pipe(fs.createWriteStream(outPath));
  
  // Title
  doc.font('Helvetica-Bold').fontSize(14).text(title, { continued: false });
  doc.font('Helvetica').fontSize(8).fillColor('#888').text('Unburied Tools — Peer Support Operations Toolkit');
  doc.moveDown(0.5);
  doc.strokeColor('#2d6a4f').lineWidth(1).moveTo(50, doc.y).lineTo(565, doc.y).stroke();
  doc.moveDown(0.5);
  
  for (const line of contentLines) {
    if (doc.y > 740) doc.addPage();
    
    if (line === '') {
      doc.moveDown(0.3);
      continue;
    }
    
    if (line.startsWith('##')) {
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#2d6a4f').text(line.replace('## ', ''));
      doc.moveDown(0.1);
    } else {
      doc.font('Courier').fontSize(9).fillColor('#1a1a1a').text(line);
    }
  }
  
  // Add closing footer
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(7).fillColor('#aaa').text('© 2026 Unburied Tools — Free for personal and nonprofit use.');
  
  doc.end();
  console.log(`✓ ${filename}`);
}

// 1. Starting a Peer Support Group
makePDF('Starting a Peer Support Group', [
  '## Phase 1: Foundation',
  '[  ] Define your purpose. What specific need does this group meet?',
  '[  ] Choose a format. In-person, virtual, or hybrid?',
  '[  ] Set a schedule. Weekly? Bi-weekly? Same time every session.',
  '[  ] Identify your co-facilitator. Never facilitate alone.',
  '[  ] Draft group agreements.',
  '[  ] Find a venue or pick a video platform.',
  '',
  '## Phase 2: Operations',
  '[  ] Create an intake form. Name, contact, what brings them.',
  '[  ] Set a max group size. 6-8 is the sweet spot.',
  '[  ] Establish a waitlist process.',
  '[  ] Draft a confidentiality agreement.',
  '[  ] Decide on record-keeping practices.',
  '[  ] Set boundaries. What happens between sessions?',
  '',
  '## Phase 3: Launch',
  '[  ] Recruit your first members.',
  '[  ] Do a dry run with your co-facilitator.',
  '[  ] Prepare an opening script.',
  '[  ] Prepare a closing ritual.',
  '[  ] Send a pre-session email.',
  '',
  '## Phase 4: Sustain',
  '[  ] Debrief after each session.',
  '[  ] Track attendance.',
  '[  ] Check in with your co-facilitator.',
  '[  ] Review group agreements periodically.',
  '[  ] Evaluate every 6-8 sessions.',
], 'starting-a-peer-support-group.pdf');

// 2. Confidentiality Agreement
makePDF('Confidentiality & Safety Agreement', [
  'For participants in peer support groups.',
  '',
  'OUR COMMITMENT',
  'We create a space where people can speak honestly without fear.',
  '',
  'CONFIDENTIALITY',
  '- Everything shared in this group stays in this group.',
  '- No screenshots, recordings, or notes that identify others.',
  '- Outside the group, do not discuss other members or stories.',
  '',
  'EXCEPTIONS (required by law)',
  'We may break confidentiality if:',
  '  - Someone is at immediate risk of serious harm',
  '  - There is suspected abuse of a child, elder, or vulnerable adult',
  '  - We receive a valid legal order',
  '',
  'SAFETY GUIDELINES',
  '- No fixing. Peer support is not therapy or advice-giving.',
  '- Share only what you are comfortable with.',
  '- One person speaks at a time.',
  '- Avoid identifying details when sharing.',
  '- No solicitation or self-promotion.',
  '',
  'ACKNOWLEDGMENT',
  '',
  'Name: ____________________________________',
  'Date: ____________________________________',
  'Group: ___________________________________',
], 'confidentiality-agreement.pdf');

// 3. Intake Form
makePDF('Peer Support Interest / Intake Form', [
  'Date received: ____________________',
  '',
  '## Contact Information',
  'Name: ____________________________________',
  'Pronouns: _______________________________',
  'Email: ____________________________________',
  'Phone: ______________  Best: [  ] Email  [  ] Phone  [  ] Text',
  '',
  '## Interest',
  '[  ] Peer support group    [  ] One-on-one    [  ] Resources',
  '',
  'What brings you here?',
  '___________________________________________________',
  '___________________________________________________',
  '',
  'Have you done peer support before?  [  ] Yes  [  ] No',
  '',
  '## Logistics',
  'Format: [  ] In person  [  ] Virtual  [  ] Either',
  'Times: [  ] Morn  [  ] Afternoon  [  ] Evenings  [  ] Weekends',
  'Accessibility needs: _______________________',
  '',
  '## Agreements',
  '[  ] I understand this is peer support, not therapy.',
  '[  ] I agree to respect confidentiality.',
  '',
  '## For Facilitator Use Only',
  'Processed by: ________________  Date: ________________',
  'Action: [  ] Waitlisted  [  ] Contacted  [  ] Referred',
], 'intake-form-template.pdf');

// 4. Session Notes
makePDF('Session Notes Template', [
  'Keep this brief. Notes are for continuity, not documentation.',
  '',
  'Date: ____________________',
  'Facilitator(s): ____________________',
  'Group / Participant: ____________________',
  'Type: [  ] Group  [  ] One-on-one  [  ] Check-in',
  '',
  '## Check-in Theme / Opening Prompt',
  '___________________________________________________',
  '',
  '## Key Themes (no identifying details)',
  '- _________________________________________',
  '- _________________________________________',
  '- _________________________________________',
  '',
  '## Follow-up Actions',
  'Who: ___________  What: ___________  By: ___________',
  'Who: ___________  What: ___________  By: ___________',
  '',
  '## Facilitator Reflection (private)',
  'What went well?',
  '___________________________________________________',
  'What would you do differently?',
  '___________________________________________________',
], 'session-notes-template.pdf');

// 5. Outcome Tracking
makePDF('Outcome Tracking Worksheet', [
  'Track every 8 sessions or 3 months.',
  '',
  '## Connectedness',
  'Trusted person to talk to:  Start: [  ] Yes / [  ] No   Now: [  ] / [  ]',
  'Knows where to find support: Start: [  ] Y / [  ] N   Now: [  ] / [  ]',
  'Feels less alone (1-5):  Start: __/5  Now: __/5',
  'Sessions attended this period: ____',
  '',
  '## Self-Reported Progress',
  '"Things feel manageable" — How often?',
  '[  ] Never  [  ] Rarely  [  ] Sometimes  [  ] Often  [  ] Always',
  '"I understand my situation better"',
  '[  ] Strongly Disagree  [  ] Disagree  [  ] Neutral  [  ] Agree  [  ] Strongly Agree',
  '',
  '## Practical Milestones',
  'Goal: ________________________  [  ] Done  [  ] In Progress  [  ] No',
  'Goal: ________________________  [  ] Done  [  ] In Progress  [  ] No',
  '',
  '## Group Health',
  'Average attendance: ____ / ____',
  'New members: ____   Members who left: ____',
  '',
  '## Period Summary',
  'Period: _________________ to _________________',
  'Active participants: _____',
  'Key outcomes: _________________________________',
  'Challenges: ___________________________________',
], 'outcome-tracking-worksheet.pdf');

// 6. Facilitator Self-Care
makePDF('Facilitator Self-Care Guide', [
  'You cannot pour from an empty cup.',
  '',
  '## Signs of Compassion Fatigue',
  '- Irritability: small things feel big',
  '- Numbness: you stop feeling moved by stories',
  '- Avoidance: you dread sessions',
  '- Intrusive thoughts: carrying stories home',
  '- Physical symptoms: headaches, sleep problems',
  '- Cynicism: "nothing ever changes"',
  '',
  '## Boundaries',
  'With participants:',
  '- Sessions start and end on time.',
  '- You are not available between sessions.',
  '- Share own experiences intentionally.',
  '- Refer out when professional help is needed.',
  '',
  'With yourself:',
  '- Keep a separate journal for processing.',
  '- Have at least one person to debrief with.',
  '- Step away from work on your days off.',
  '',
  '## Daily Practices',
  'Before session: 5 min quiet. Review plan. Check in with co-facilitator.',
  'After session: Write notes. Transition ritual (walk, water, stretch).',
  'Weekly: Review themes. One non-work activity. Connect with a peer.',
  '',
  '## When to Step Back',
  '- You dread sessions for more than two weeks.',
  '- Your own mental health is declining.',
  '- Someone a trusted person is worried about you.',
  '- A participant story triggers your unprocessed experience.',
  '',
  'Stepping back is not failure. It is the most responsible thing you can do.',
], 'facilitator-self-care-guide.pdf');

console.log('\nAll 6 PDFs generated!');
