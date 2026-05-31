#!/usr/bin/env python3
"""
Generate clean, standard-compliant PDFs using reportlab (if available) or pure Python.
"""
import os, time

outdir = os.path.join(os.path.dirname(__file__), 'products')
os.makedirs(outdir, exist_ok=True)

def make_pdf(title, body_text, filename):
    """Generate a clean PDF with proper structure"""
    
    lines = body_text.split('\n')
    
    pdf = []
    
    def add(s):
        pdf.append(s)
    
    # Header
    add(b'%PDF-1.4')
    add(b'%\xff\xff\xff\xff')
    
    # Object tracking
    objects = []
    
    class Obj:
        def __init__(self, num, content):
            self.num = num
            self.content = content
    
    # We'll build objects manually and track their byte offsets
    obj_num = 1
    
    # --- Page content stream (will be object 1) ---
    content_parts = [
        b'BT',
        b'/F1 16 Tf',
        b'1 0 0 1 50 730 Tm',
        b'(' + title.encode('latin-1') + b') Tj',
        b'ET',
        b'BT',
        b'/F1 8 Tf',
        b'1 0 0 1 50 712 Tm',
        b'(Unburied Tools - Peer Support Operations Toolkit) Tj',
        b'ET',
        b'q',
        b'0.176 0.416 0.310 RG',
        b'1 w',
        b'50 700 m',
        b'565 700 l',
        b'S',
        b'Q',
    ]
    
    y_pos = 680
    for line in lines:
        if not line.strip():
            y_pos -= 10
            continue
        if y_pos < 50:
            break
        if line.startswith('## '):
            line_text = line[3:].strip()
            content_parts.append(b'BT')
            content_parts.append(b'/F2 12 Tf')
            content_parts.append(f'1 0 0 1 50 {y_pos} Tm'.encode())
            content_parts.append(b'(' + line_text.encode('latin-1') + b') Tj')
            content_parts.append(b'ET')
            y_pos -= 20
        else:
            line_text = line.strip()
            content_parts.append(b'BT')
            content_parts.append(b'/F1 9 Tf')
            content_parts.append(f'1 0 0 1 60 {y_pos} Tm'.encode())
            content_parts.append(b'(' + line_text.encode('latin-1') + b') Tj')
            content_parts.append(b'ET')
            y_pos -= 14
    
    stream_data = b'\n'.join(content_parts)
    stream_length = len(stream_data)
    
    # Object 1: Content stream
    obj1 = b'1 0 obj\n<< /Length ' + str(stream_length).encode() + b' >>\nstream\n' + stream_data + b'\nendstream\nendobj\n'
    
    # Object 2: Page
    obj2 = b'2 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 1 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>\nendobj\n'
    
    # Object 3: Pages tree
    obj3 = b'3 0 obj\n<< /Type /Pages /Kids [2 0 R] /Count 1 >>\nendobj\n'
    
    # Object 4: Helvetica font
    obj4 = b'4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
    
    # Object 5: Helvetica-Bold font
    obj5 = b'5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
    
    # Object 6: Catalog
    obj6 = b'6 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n'
    
    # Build full body
    body = obj1 + obj2 + obj3 + obj4 + obj5 + obj6
    
    offsets = []
    
    # Write header
    body_bytes = body
    header = b'%PDF-1.4\n%\xff\xff\xff\xff\n'
    
    # Find offsets of each object
    body_str = body.decode('latin-1')
    for i in range(1, 7):
        tag = f'\n{i} 0 obj'
        idx = body_str.find(tag)
        if idx >= 0:
            offsets.append(len(header) + idx + 1)  # +1 for the newline
    
    # Build cross-reference table
    xref_offset = len(header) + len(body)
    num_objects = 7
    
    xref = b'xref\n'
    xref += b'0 ' + str(num_objects).encode() + b'\n'
    xref += b'0000000000 65535 f \n'
    for off in offsets:
        xref += f'{off:010d} 00000 n \n'.encode()
    
    trailer = b'trailer\n<< /Size ' + str(num_objects).encode() + b' /Root 6 0 R >>\nstartxref\n' + str(xref_offset).encode() + b'\n%%EOF\n'
    
    # Write file
    full = header + body + xref + trailer
    
    outpath = os.path.join(outdir, filename)
    with open(outpath, 'wb') as f:
        f.write(full)
    
    size = os.path.getsize(outpath)
    
    # Verify with PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(outpath)
        pages = len(reader.pages)
        text = reader.pages[0].extract_text()[:100] if pages > 0 else '(empty)'
        print(f"✓ {filename} ({size} bytes, {pages} page(s)) - text: \"{text}...\"")
    except Exception as e:
        print(f"⚠ {filename} ({size} bytes) - validation error: {e}")

# 1. Starting a Peer Support Group
make_pdf('Starting a Peer Support Group', """## Phase 1: Foundation
  Define your purpose. What need does this group meet?
  Choose a format. In-person, virtual, or hybrid?
  Set a schedule. Weekly? Bi-weekly?
  Identify your co-facilitator.
  Draft group agreements.
  Find a venue or pick a video platform.

## Phase 2: Operations
  Create an intake form.
  Set a max group size (6-8).
  Establish a waitlist.
  Draft a confidentiality agreement.
  Set boundaries between sessions.

## Phase 3: Launch
  Recruit your first members.
  Do a dry run with co-facilitator.
  Prepare an opening script.
  Prepare a closing ritual.
  Send a pre-session email.

## Phase 4: Sustain
  Debrief after each session.
  Track attendance.
  Check in with co-facilitator.
  Review group agreements.
  Evaluate every 6 to 8 sessions.""", 'starting-a-peer-support-group.pdf')

# 2. Confidentiality Agreement
make_pdf('Confidentiality & Safety Agreement', """## Our Commitment
  A space where people can speak honestly without fear.

## Confidentiality
  Everything shared stays in this group.
  No recordings or notes that identify others.
  Outside the group, do not discuss others.

## Exceptions (required by law)
  Immediate risk of serious harm.
  Suspected abuse of child, elder, adult.
  Valid legal order.

## Safety Guidelines
  No fixing. Peer support is not therapy.
  Share only what you are comfortable with.
  One person speaks at a time.
  No solicitation or self-promotion.

## Acknowledgment
  Name: _______________________________
  Date: _______________________________
  Group: ______________________________""", 'confidentiality-agreement.pdf')

# 3. Intake Form
make_pdf('Peer Support Interest / Intake Form', """## Contact Information
  Name: _______________________________
  Pronouns: ___________________________
  Email: ______________________________
  Phone: ______________________________

## Interest
  ___ Peer support group  ___ One-on-one
  What brings you here?
  ____________________________________

## Logistics
  Format: ___ In person  ___ Virtual
  Times: ___ Morn  ___ Afternoon  ___ Eve
  Accessibility needs: _______________

## Agreements
  ___ I understand this is not therapy.
  ___ I agree to respect confidentiality.

## Facilitator Use Only
  Processed by: ______________________
  Action: ___ Waitlist  ___ Contacted""", 'intake-form-template.pdf')

# 4. Session Notes
make_pdf('Session Notes Template', """## Session Info
  Date: _______________________________
  Facilitator: ________________________
  Participant or Group: _______________

## Check-in Theme
  ____________________________________

## Key Themes
  - _______________________________
  - _______________________________
  - _______________________________

## Follow-up Actions
  Who: ________ What: ________ By: ___

## Facilitator Reflection
  What went well?
  ____________________________________
  What to do differently?
  ____________________________________""", 'session-notes-template.pdf')

# 5. Outcome Tracking
make_pdf('Outcome Tracking Worksheet', """## Connectedness
  Trusted person: Start Y/N __ Now Y/N __
  Feels less alone (1-5): Start __ Now __
  Sessions this period: ____

## Self-Reported Progress
  Things feel manageable? How often?
  Never / Rarely / Sometimes / Often / Always

## Practical Milestones
  Goal: __________________ Done? Y/N
  Goal: __________________ Done? Y/N

## Group Health
  Average attendance: ____ / ____
  New: ____  Left: ____

## Period Summary
  Period: ___________ to ___________
  Active participants: _____""", 'outcome-tracking-worksheet.pdf')

# 6. Facilitator Self-Care
make_pdf('Facilitator Self-Care Guide', """## Signs of Compassion Fatigue
  Irritability - small things feel big
  Numbness - stories no longer move you
  Avoidance - you dread sessions
  Intrusive thoughts - carrying work home
  Physical symptoms - headaches, fatigue

## Boundaries
  Sessions start and end on time.
  Not available between sessions.
  Share own experiences intentionally.
  Refer out when professional help needed.

## Daily Practices
  Before session: 5 min of quiet.
  After session: notes, transition ritual.
  Weekly: review themes, connect with peer.

## When to Step Back
  Dreading sessions for over 2 weeks.
  Your own health is declining.
  A trusted person is worried about you.
  A participant's story triggers you.

  Stepping back is not failure.""", 'facilitator-self-care-guide.pdf')

print('\nAll 6 PDFs generated!')
