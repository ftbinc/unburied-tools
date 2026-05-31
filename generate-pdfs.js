#!/usr/bin/env node
/**
 * Generate PDFs using pdf-lib which produces standard PDFs with standard fonts.
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'products');
fs.mkdirSync(outDir, { recursive: true });

function escapeText(s) {
  return s.replace(/[\\()]/g, '\\$&');
}

async function makePDF(title, bodyText, filename) {
  const doc = await PDFDocument.create();
  
  // Use standard fonts (Helvetica and Helvetica-Bold are always available in any PDF viewer)
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  
  const page = doc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  let y = height - 50;
  const margin = 50;
  const leading = 14;
  
  // Title
  page.drawText(title, {
    x: margin,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 22;
  
  // Subtitle
  page.drawText('Unburied Tools - Peer Support Operations Toolkit', {
    x: margin,
    y: y,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 12;
  
  // Line
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: rgb(0.176, 0.416, 0.310),
  });
  y -= 18;
  
  const lines = bodyText.split('\n');
  
  for (const line of lines) {
    if (y < 50) {
      // New page
      const newPage = doc.addPage([612, 792]);
      y = height - 50;
    }
    
    if (line.trim() === '') {
      y -= 10;
      continue;
    }
    
    if (line.startsWith('## ')) {
      const text = line.replace('## ', '').trim();
      page.drawText(text, {
        x: margin,
        y: y,
        size: 12,
        font: fontBold,
        color: rgb(0.176, 0.416, 0.310),
      });
      y -= 20;
    } else {
      const text = line.trim();
      page.drawText(text, {
        x: margin + 10,
        y: y,
        size: 9,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= leading;
    }
  }
  
  // Footer
  page.drawText('(c) 2026 Unburied Tools - Free for personal and nonprofit use.', {
    x: margin,
    y: 30,
    size: 7,
    font: font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  const pdfBytes = await doc.save();
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, pdfBytes);
  
  const size = fs.statSync(outPath).size;
  console.log(`✓ ${filename} (${size} bytes)`);
}

async function main() {
  // 1. Starting a Peer Support Group
  await makePDF('Starting a Peer Support Group', 
    '## Phase 1: Foundation\n' +
    '  Define your purpose. What need does this group meet?\n' +
    '  Choose a format. In-person, virtual, or hybrid?\n' +
    '  Set a schedule. Weekly? Bi-weekly?\n' +
    '  Identify your co-facilitator.\n' +
    '  Draft group agreements.\n' +
    '  Find a venue or pick a video platform.\n\n' +
    '## Phase 2: Operations\n' +
    '  Create an intake form.\n' +
    '  Set a max group size (6-8).\n' +
    '  Establish a waitlist.\n' +
    '  Draft a confidentiality agreement.\n' +
    '  Set boundaries between sessions.\n\n' +
    '## Phase 3: Launch\n' +
    '  Recruit your first members.\n' +
    '  Do a dry run with co-facilitator.\n' +
    '  Prepare an opening script.\n' +
    '  Prepare a closing ritual.\n' +
    '  Send a pre-session email.\n\n' +
    '## Phase 4: Sustain\n' +
    '  Debrief after each session.\n' +
    '  Track attendance.\n' +
    '  Check in with co-facilitator.\n' +
    '  Review group agreements.\n' +
    '  Evaluate every 6 to 8 sessions.',
    'starting-a-peer-support-group.pdf');
  
  // 2. Confidentiality Agreement
  await makePDF('Confidentiality & Safety Agreement',
    'OUR COMMITMENT\n' +
    '  A space where people can speak honestly without fear.\n\n' +
    'CONFIDENTIALITY\n' +
    '  Everything shared stays in this group.\n' +
    '  No recordings or notes that identify others.\n' +
    '  Outside the group, do not discuss others.\n\n' +
    'EXCEPTIONS (required by law)\n' +
    '  Immediate risk of serious harm.\n' +
    '  Suspected abuse of child, elder, or vulnerable adult.\n' +
    '  Valid legal order.\n\n' +
    'SAFETY GUIDELINES\n' +
    '  No fixing. Peer support is not therapy.\n' +
    '  Share only what you are comfortable with.\n' +
    '  One person speaks at a time.\n' +
    '  No solicitation or self-promotion.\n\n' +
    'ACKNOWLEDGMENT\n\n' +
    '  Name: _______________________________\n' +
    '  Date: _______________________________\n' +
    '  Group: ______________________________',
    'confidentiality-agreement.pdf');
  
  // 3. Intake Form
  await makePDF('Peer Support Interest / Intake Form',
    'CONTACT INFORMATION\n' +
    '  Name: _______________________________\n' +
    '  Pronouns: ___________________________\n' +
    '  Email: ______________________________\n' +
    '  Phone: ______________________________\n\n' +
    'INTEREST\n' +
    '  ___ Peer support group  ___ One-on-one\n' +
    '  What brings you here?\n' +
    '  _____________________________________\n\n' +
    'LOGISTICS\n' +
    '  Format: ___ In person  ___ Virtual\n' +
    '  Times: ___ Morn  ___ Afternoon  ___ Eve\n' +
    '  Accessibility needs: ________________\n\n' +
    'AGREEMENTS\n' +
    '  ___ I understand this is not therapy.\n' +
    '  ___ I agree to respect confidentiality.\n\n' +
    'FOR FACILITATOR USE ONLY\n' +
    '  Processed by: _______________________\n' +
    '  Action: ___ Waitlist  ___ Contacted',
    'intake-form-template.pdf');
  
  // 4. Session Notes
  await makePDF('Session Notes Template',
    'SESSION INFO\n' +
    '  Date: _______________________________\n' +
    '  Facilitator: ________________________\n' +
    '  Participant or Group: _______________\n\n' +
    'CHECK-IN THEME\n' +
    '  _____________________________________\n\n' +
    'KEY THEMES (no identifying details)\n' +
    '  - ___________________________________\n' +
    '  - ___________________________________\n' +
    '  - ___________________________________\n\n' +
    'FOLLOW-UP ACTIONS\n' +
    '  Who:________ What:________ By:_______\n\n' +
    'FACILITATOR REFLECTION (private)\n' +
    '  What went well?\n' +
    '  _____________________________________\n' +
    '  What to do differently?\n' +
    '  _____________________________________',
    'session-notes-template.pdf');
  
  // 5. Outcome Tracking
  await makePDF('Outcome Tracking Worksheet',
    'CONNECTEDNESS\n' +
    '  Trusted person: Start Y/N __ Now Y/N __\n' +
    '  Feels less alone (1-5): Start __ Now __\n' +
    '  Sessions this period: ____\n\n' +
    'SELF-REPORTED PROGRESS\n' +
    '  Things feel manageable? How often?\n' +
    '  Never / Rarely / Sometimes / Often / Always\n\n' +
    'PRACTICAL MILESTONES\n' +
    '  Goal: __________________ Done? Y/N\n' +
    '  Goal: __________________ Done? Y/N\n\n' +
    'GROUP HEALTH\n' +
    '  Average attendance: ____ / ____\n' +
    '  New: ____  Left: ____\n\n' +
    'PERIOD SUMMARY\n' +
    '  Period: ___________ to ___________\n' +
    '  Active participants: _____',
    'outcome-tracking-worksheet.pdf');
  
  // 6. Facilitator Self-Care
  await makePDF('Facilitator Self-Care Guide',
    'SIGNS OF COMPASSION FATIGUE\n' +
    '  Irritability - small things feel big\n' +
    '  Numbness - stories no longer move you\n' +
    '  Avoidance - you dread sessions\n' +
    '  Intrusive thoughts - carrying work home\n' +
    '  Physical symptoms - headaches, fatigue\n\n' +
    'BOUNDARIES\n' +
    '  Sessions start and end on time.\n' +
    '  Not available between sessions.\n' +
    '  Share own experiences intentionally.\n' +
    '  Refer out when professional help needed.\n\n' +
    'DAILY PRACTICES\n' +
    '  Before session: 5 min of quiet.\n' +
    '  After session: notes, transition ritual.\n' +
    '  Weekly: review themes, connect with peer.\n\n' +
    'WHEN TO STEP BACK\n' +
    '  Dreading sessions for over 2 weeks.\n' +
    '  Your own health is declining.\n' +
    '  A trusted person is worried about you.\n' +
    '  A participant story triggers you.\n\n' +
    '  Stepping back is not failure.',
    'facilitator-self-care-guide.pdf');
  
  console.log('\nAll 6 PDFs generated!');
}

main().catch(err => console.error('Error:', err));
