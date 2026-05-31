#!/usr/bin/env python3
"""
Generate plain, maximally-compatible PDFs with no compression, standard fonts.
"""
import os, struct

outdir = os.path.join(os.path.dirname(__file__), 'products')
os.makedirs(outdir, exist_ok=True)

def escape_pdf(s):
    """Escape string for PDF text"""
    return s.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

def make_pdf(title, lines, filename):
    objects = []
    obj_num = 1
    
    def add_obj(body):
        nonlocal obj_num
        n = obj_num
        obj_num += 1
        return f"{n} 0 obj\n{body}\nendobj"
    
    font_helv = 3  # will be object 3
    font_bold = 4  # will be object 4
    pages = []
    current_page_lines = []
    y = 750
    page_num = 0
    
    def flush_page():
        nonlocal page_num, current_page_lines, y
        
        if not current_page_lines:
            return
            
        page_num += 1
        content_parts = []
        content_parts.append('BT')
        content_parts.append('/F1 16 Tf')
        content_parts.append(f'1 0 0 1 50 {y} Tm')
        content_parts.append(f'({escape_pdf(title)}) Tj')
        content_parts.append('ET')
        
        # Subtitle
        y2 = y - 20
        content_parts.append('BT')
        content_parts.append('/F1 8 Tf')
        content_parts.append(f'1 0 0 1 50 {y2} Tm')
        content_parts.append(f'(Unburied Tools - Peer Support Operations Toolkit) Tj')
        content_parts.append('ET')
        
        # Line
        content_parts.append('q')
        content_parts.append('0.176 0.416 0.310 RG')
        content_parts.append('1 w')
        content_parts.append('50 540 m')
        content_parts.append('565 540 l')
        content_parts.append('S')
        content_parts.append('Q')
        
        y_pos = 520
        y_step = 14
        
        for line in current_page_lines:
            if y_pos < 50:
                break
            if line == '':
                y_pos -= 8
                continue
            if line.startswith('## '):
                content_parts.append('BT')
                content_parts.append('/F2 12 Tf')
                content_parts.append(f'1 0 0 1 50 {y_pos} Tm')
                content_parts.append(f'({escape_pdf(line[3:])}) Tj')
                content_parts.append('ET')
                y_pos -= 18
            elif line.startswith('**') and line.endswith('**'):
                content_parts.append('BT')
                content_parts.append('/F1 10 Tf')
                content_parts.append(f'1 0 0 1 50 {y_pos} Tm')
                content_parts.append(f'({escape_pdf(line[2:-2])}) Tj')
                content_parts.append('ET')
                y_pos -= 14
            else:
                content_parts.append('BT')
                content_parts.append('/F1 9 Tf')
                content_parts.append(f'1 0 0 1 60 {y_pos} Tm')
                content_parts.append(f'({escape_pdf(line)}) Tj')
                content_parts.append('ET')
                y_pos -= 14
        
        content = '\n'.join(content_parts)
        
        # Content stream
        content_obj = add_obj(f"<< /Length {len(content)} >>\nstream\n{content}\nendstream")
        
        # Page
        page = f"""{obj_num + 1} 0 obj
<<
/Type /Page
/Parent 1 0 R
/MediaBox [0 0 612 792]
/Contents {obj_num} 0 R
/Resources <<
/Font << /F1 3 0 R /F2 4 0 R >>
>>
/UserUnit 1
>>
endobj"""
        
        return (content_obj, page)
    
    # Build pages
    for line in lines:
        if y < 50:
            continue
        if line.startswith('\\n') or line == '':
            y -= 8
            continue
        if line.startswith('## '):
            y -= 18
        else:
            y -= 14
        current_page_lines.append(line)
        if y < 50:
            p = flush_page()
            if p:
                pages.append(p)
            current_page_lines = []
            y = 750
    
    if current_page_lines:
        p = flush_page()
        if p:
            pages.append(p)
    
    # Build font objects
    font_helv_obj = add_obj("""<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
/Encoding /WinAnsiEncoding
>>""")
    
    font_bold_obj = add_obj("""<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
/Encoding /WinAnsiEncoding
>>""")
    
    # Parent Pages
    parent = f"""1 0 obj
<<
/Type /Pages
/Kids [{' '.join([f'{p_num} 0 R' for p_num in range(6, 6 + len(pages))])}]
/Count {len(pages)}
>>
endobj"""
    
    # Catalog
    catalog = f"""2 0 obj
<<
/Type /Catalog
/Pages 1 0 R
>>
endobj"""
    
    body_parts = [catalog, parent, font_helv_obj, font_bold_obj]
    for page_objs in pages:
        body_parts.append(page_objs[0])  # content stream
        body_parts.append(page_objs[1])  # page
    
    body = '\n'.join(body_parts)
    preamble = '%PDF-1.3\n%\\xff\\xff\\xff\\xff\n'
    
    # Build xref table
    full = preamble + body + '\n'
    xref_offset = len(full)
    
    xref = f"""xref
0 {obj_num}
0000000000 65535 f 
"""
    offset = len(preamble)
    
    lines_map = {}
    for i in range(1, obj_num):
        # Find the object in body
        tag = f"\n{i} 0 obj"
        pos = body.find(tag)
        if pos >= 0:
            lines_map[i] = pos + len(preamble) + 1  # +1 for newline
    
    for i in range(1, obj_num):
        offset = lines_map.get(i, 0)
        xref += f"{offset:010d} 00000 n \n"
    
    xref += f"""trailer
<<
/Size {obj_num}
/Root 2 0 R
>>
startxref
{xref_offset}
%%EOF"""
    
    full += xref
    
    outpath = os.path.join(outdir, filename)
    with open(outpath, 'wb') as f:
        f.write(full.encode('latin-1'))
    
    size = os.path.getsize(outpath)
    print(f"✓ {filename} ({size} bytes, {len(pages)} page(s))")

# 1. Starting a Peer Support Group
make_pdf('Starting a Peer Support Group', [
    '## Phase 1: Foundation',
    '  Define your purpose. What need does this group meet?',
    '  Choose a format. In-person, virtual, or hybrid?',
    '  Set a schedule. Weekly? Bi-weekly?',
    '  Identify your co-facilitator.',
    '  Draft group agreements.',
    '  Find a venue or pick a video platform.',
    '',
    '## Phase 2: Operations',
    '  Create an intake form.',
    '  Set a max group size (6-8).',
    '  Establish a waitlist.',
    '  Draft a confidentiality agreement.',
    '  Set boundaries between sessions.',
    '',
    '## Phase 3: Launch',
    '  Recruit your first members.',
    '  Do a dry run with co-facilitator.',
    '  Prepare an opening script.',
    '  Prepare a closing ritual.',
    '  Send a pre-session email.',
    '',
    '## Phase 4: Sustain',
    '  Debrief after each session.',
    '  Track attendance.',
    '  Check in with co-facilitator.',
    '  Review group agreements.',
    '  Evaluate every 6 to 8 sessions.',
], 'starting-a-peer-support-group.pdf')

# 2. Confidentiality Agreement
make_pdf('Confidentiality & Safety Agreement', [
    'For participants in peer support groups.',
    '',
    'Confidentiality',
    '  Everything shared stays in this group.',
    '  No recordings or notes that identify others.',
    '  Outside the group, do not discuss others.',
    '',
    'Exceptions (required by law)',
    '  Immediate risk of serious harm.',
    '  Suspected abuse of child, elder, adult.',
    '  Valid legal order.',
    '',
    'Safety Guidelines',
    '  No fixing. Peer support is not therapy.',
    '  Share only what you are comfortable with.',
    '  One person speaks at a time.',
    '  No solicitation or self-promotion.',
    '',
    'Acknowledgment',
    '',
    'Name: _______________________________',
    'Date: _______________________________',
    'Group: ______________________________',
], 'confidentiality-agreement.pdf')

# 3. Intake Form
make_pdf('Peer Support Interest / Intake Form', [
    'Date: _______________________________',
    '',
    'Contact Information',
    'Name: _______________________________',
    'Pronouns: ___________________________',
    'Email: ______________________________',
    'Phone: ______________________________',
    '',
    'Interest',
    '  [ ] Peer support group  [ ] One-on-one',
    '  What brings you here?',
    '  ____________________________________',
    '',
    'Logistics',
    '  Format: [ ] In person  [ ] Virtual',
    '  Times: [ ] Morn  [ ] Afternoon  [ ] Eve',
    '  Accessibility needs: _______________',
    '',
    'Agreements',
    '  [ ] Understand this is not therapy.',
    '  [ ] Agree to respect confidentiality.',
    '',
    'Facilitator Use Only',
    '  Processed by: ______________________',
    '  Action: [ ] Waitlist  [ ] Contacted',
], 'intake-form-template.pdf')

# 4. Session Notes
make_pdf('Session Notes Template', [
    'Keep this brief -- notes for continuity only.',
    '',
    'Date: _______________________________',
    'Facilitator: ________________________',
    'Participant or Group: _______________',
    '',
    'Check-in theme',
    '  ____________________________________',
    '',
    'Key themes',
    '  - _______________________________',
    '  - _______________________________',
    '  - _______________________________',
    '',
    'Follow-up actions',
    '  Who: ________ What: ________ By: ___',
    '',
    'Facilitator reflection (private)',
    '  What went well?',
    '  ____________________________________',
    '  What to do differently?',
    '  ____________________________________',
], 'session-notes-template.pdf')

# 5. Outcome Tracking
make_pdf('Outcome Tracking Worksheet', [
    'Track every 8 sessions or 3 months.',
    '',
    'Connectedness',
    '  Trusted person: Start Y/N __ Now Y/N __',
    '  Feels less alone (1-5): Start __ Now __',
    '  Sessions this period: ____',
    '',
    'Self-Reported Progress',
    '  "Things feel manageable" How often?',
    '  Never / Rarely / Sometimes / Often',
    '',
    'Practical Milestones',
    '  Goal: __________________ Done? Y/N',
    '  Goal: __________________ Done? Y/N',
    '',
    'Group Health',
    '  Average attendance: ____ / ____',
    '  New: ____  Left: ____',
    '',
    'Period: ___________ to ___________',
    'Active participants: _____',
], 'outcome-tracking-worksheet.pdf')

# 6. Facilitator Self-Care
make_pdf('Facilitator Self-Care Guide', [
    'You cannot pour from an empty cup.',
    '',
    'Signs of Compassion Fatigue',
    '  Irritability - small things feel big',
    '  Numbness - stories no longer move you',
    '  Avoidance - you dread sessions',
    '  Intrusive thoughts - carrying work home',
    '  Physical symptoms - headaches, fatigue',
    '',
    'Boundaries',
    '  Sessions start and end on time.',
    '  Not available between sessions.',
    '  Share own experiences intentionally.',
    '  Refer out when professional help needed.',
    '',
    'Daily Practices',
    '  Before session: 5 min of quiet.',
    '  After session: notes, transition ritual.',
    '  Weekly: review themes, connect with peer.',
    '',
    'When to Step Back',
    '  Dreading sessions for over 2 weeks.',
    '  Your own health is declining.',
    '  A trusted person is worried about you.',
    "  A participant's story triggers you.",
    '',
    'Stepping back is not failure.',
    'It is the most responsible thing to do.',
], 'facilitator-self-care-guide.pdf')

print('\nAll 6 PDFs generated!')
