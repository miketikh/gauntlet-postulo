# Demo Seed Data & Sample Documents

This file contains the exact seed data and sample document templates needed for the 5-minute demo.

---

## Database Seed Data

### SQL Seed Script

```sql
-- Insert Test Firms
INSERT INTO firms (id, name, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Miller & Associates Law', NOW(), NOW()),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Johnson Legal Group', NOW(), NOW());

-- Insert Test Users for Firm 1 (Miller & Associates)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, firm_id, created_at, updated_at) VALUES
-- Password for all: "Demo2024!"
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'sarah@millerlaw.com', '$2b$10$rQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQ', 'Sarah', 'Miller', 'attorney', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW()),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'james@millerlaw.com', '$2b$10$rQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQ', 'James', 'Park', 'attorney', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW()),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 'lisa@millerlaw.com', '$2b$10$rQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQ', 'Lisa', 'Chen', 'paralegal', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW());

-- Insert Test Users for Firm 2 (Johnson Legal)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, firm_id, created_at, updated_at) VALUES
('f6a7b8c9-d0e1-2345-f123-456789012345', 'admin@johnsonlegal.com', '$2b$10$rQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQZ8JQ', 'Robert', 'Johnson', 'admin', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW(), NOW());

-- Insert Personal Injury Template for Firm 1
INSERT INTO templates (id, name, description, sections, variables, is_active, is_system_template, firm_id, version, created_by, created_at, updated_at) VALUES
(
  'a7b8c9d0-e1f2-3456-a123-4567890123456',
  'Personal Injury Demand Letter',
  'Standard demand letter for auto accident personal injury cases with medical damages',
  '[
    {
      "id": "section-1",
      "title": "Letter Header",
      "type": "static",
      "content": "<p><strong>{{plaintiff_name}}</strong><br/>c/o Miller & Associates Law<br/>123 Legal Plaza, Suite 500<br/>San Francisco, CA 94102</p><p><strong>RE: Demand for Settlement</strong><br/>Date of Loss: {{incident_date}}<br/>Our Client: {{plaintiff_name}}<br/>Your Insured: {{defendant_name}}</p>",
      "order": 1,
      "required": true
    },
    {
      "id": "section-2",
      "title": "Introduction",
      "type": "static",
      "content": "<p>Dear Claims Adjuster:</p><p>This office represents {{plaintiff_name}} in connection with injuries sustained in a motor vehicle accident on {{incident_date}}, caused by the negligence of your insured, {{defendant_name}}.</p>",
      "order": 2,
      "required": true
    },
    {
      "id": "section-3",
      "title": "Incident Facts",
      "type": "ai_generated",
      "promptGuidance": "Based on the police report and accident documentation, provide a detailed factual account of how the accident occurred, including location, time, road conditions, vehicle positions, and the defendant'\''s negligent actions. Be specific about speeds, distances, and witness observations if available. Use professional legal tone.",
      "order": 3,
      "required": true
    },
    {
      "id": "section-4",
      "title": "Liability Analysis",
      "type": "ai_generated",
      "promptGuidance": "Analyze why the defendant is legally liable for the accident. Reference applicable traffic laws violated, negligence elements (duty, breach, causation, damages), and any citations issued. Be assertive about clear liability.",
      "order": 4,
      "required": true
    },
    {
      "id": "section-5",
      "title": "Injuries and Medical Treatment",
      "type": "ai_generated",
      "promptGuidance": "Using the medical records provided, describe the injuries sustained in the accident, the immediate medical treatment received, ongoing treatment including physical therapy, and the plaintiff'\''s pain and suffering. Include specific diagnoses, treatment modalities, number of visits, and current medical status. Reference specific medical providers and dates.",
      "order": 5,
      "required": true
    },
    {
      "id": "section-6",
      "title": "Economic Damages",
      "type": "ai_generated",
      "promptGuidance": "Calculate and itemize all economic damages including medical expenses (ER, hospital, specialists, PT, medications), lost wages, transportation costs, and any other out-of-pocket expenses. Present in a clear breakdown format with subtotals. Use the actual amounts from documentation provided. Total should equal {{medical_total}} plus wage loss.",
      "order": 6,
      "required": true
    },
    {
      "id": "section-7",
      "title": "Non-Economic Damages",
      "type": "ai_generated",
      "promptGuidance": "Describe the pain, suffering, emotional distress, loss of enjoyment of life, and inconvenience experienced by the plaintiff. Be descriptive about impact on daily activities, hobbies, family time, and quality of life. Justify why non-economic damages warrant significant compensation.",
      "order": 7,
      "required": true
    },
    {
      "id": "section-8",
      "title": "Settlement Demand",
      "type": "static",
      "content": "<p><strong>DEMAND FOR SETTLEMENT</strong></p><p>In light of the clear liability, significant injuries, and substantial damages outlined above, we demand settlement in the amount of <strong>{{demand_amount}}</strong> to fully compensate our client for all damages sustained.</p><p>This demand is valid for 30 days from the date of this letter. We expect a substantive response within that timeframe. Failure to respond or make a reasonable settlement offer will leave us no choice but to file a lawsuit to protect our client'\''s interests.</p>",
      "order": 8,
      "required": true
    },
    {
      "id": "section-9",
      "title": "Closing",
      "type": "static",
      "content": "<p>We are enclosing copies of all relevant documentation including medical records, bills, wage loss verification, police report, and photographs. Please acknowledge receipt of this demand and forward to the appropriate decision-maker.</p><p>Very truly yours,</p><p><strong>Sarah Miller, Esq.</strong><br/>Miller & Associates Law</p>",
      "order": 9,
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "name": "plaintiff_name",
      "label": "Plaintiff Name",
      "type": "text",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "defendant_name",
      "label": "Defendant Name",
      "type": "text",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "incident_date",
      "label": "Date of Incident",
      "type": "date",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "injury_description",
      "label": "Brief Injury Description",
      "type": "text",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "medical_total",
      "label": "Total Medical Expenses",
      "type": "currency",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "demand_amount",
      "label": "Settlement Demand Amount",
      "type": "currency",
      "required": true,
      "defaultValue": ""
    }
  ]'::jsonb,
  true,
  false,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1,
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  NOW(),
  NOW()
);

-- Insert Contract Breach Template for Firm 1
INSERT INTO templates (id, name, description, sections, variables, is_active, is_system_template, firm_id, version, created_by, created_at, updated_at) VALUES
(
  'b8c9d0e1-f2a3-4567-b234-567890123456',
  'Contract Breach Demand Letter',
  'Demand letter for breach of contract cases',
  '[
    {
      "id": "section-1",
      "title": "Letter Header",
      "type": "static",
      "content": "<p><strong>{{client_name}}</strong><br/>c/o Miller & Associates Law<br/>123 Legal Plaza, Suite 500<br/>San Francisco, CA 94102</p><p><strong>RE: Demand for Payment - Breach of Contract</strong><br/>Contract Date: {{contract_date}}<br/>Our Client: {{client_name}}<br/>Breaching Party: {{defendant_name}}</p>",
      "order": 1,
      "required": true
    },
    {
      "id": "section-2",
      "title": "Contract Summary",
      "type": "ai_generated",
      "promptGuidance": "Summarize the key terms of the contract, including parties, consideration, obligations, and performance timeline. Reference the contract document provided.",
      "order": 2,
      "required": true
    },
    {
      "id": "section-3",
      "title": "Breach Details",
      "type": "ai_generated",
      "promptGuidance": "Describe specifically how the defendant breached the contract, including missed deadlines, non-performance, or violation of terms. Be specific with dates and obligations.",
      "order": 3,
      "required": true
    },
    {
      "id": "section-4",
      "title": "Damages",
      "type": "ai_generated",
      "promptGuidance": "Calculate damages resulting from the breach, including direct losses, consequential damages, and any liquidated damages specified in the contract.",
      "order": 4,
      "required": true
    },
    {
      "id": "section-5",
      "title": "Demand",
      "type": "static",
      "content": "<p>We demand payment of {{demand_amount}} within 15 days to resolve this matter without litigation.</p><p>Sincerely,<br/><strong>Sarah Miller, Esq.</strong></p>",
      "order": 5,
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "name": "client_name",
      "label": "Client Name",
      "type": "text",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "defendant_name",
      "label": "Defendant Name",
      "type": "text",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "contract_date",
      "label": "Contract Date",
      "type": "date",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "demand_amount",
      "label": "Demand Amount",
      "type": "currency",
      "required": true,
      "defaultValue": ""
    }
  ]'::jsonb,
  true,
  false,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1,
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  NOW(),
  NOW()
);
```

---

## Sample Document Templates

### 1. Medical Records PDF Content

**File Name:** `Medical_Records_Rodriguez_John.pdf`

```
PACIFIC MEDICAL CENTER
Emergency Department Visit Summary

Patient: Rodriguez, John M.
DOB: 08/14/1985
Date of Service: March 15, 2024
MRN: 45678923

CHIEF COMPLAINT: Motor vehicle accident with neck and back pain

HISTORY OF PRESENT ILLNESS:
39-year-old male presents to ED approximately 2 hours after rear-end motor vehicle collision.
Patient reports he was stopped at red light when struck from behind by another vehicle traveling
approximately 35 mph. Patient denies loss of consciousness. Immediate onset of neck pain and
lower back pain. Denies numbness, tingling, or weakness in extremities.

PHYSICAL EXAMINATION:
- Cervical spine: Moderate tenderness to palpation, decreased range of motion
- Lumbar spine: Tenderness to palpation L3-L5, muscle spasm noted
- Neurological: Motor strength 5/5 all extremities, sensation intact

IMAGING:
- Cervical X-ray: No acute fracture or dislocation
- Lumbar X-ray: No acute fracture, mild straightening of normal lordosis

DIAGNOSIS:
1. Cervical sprain/strain (ICD-10: S13.4)
2. Lumbar contusion (ICD-10: S33.5)
3. Motor vehicle accident

TREATMENT:
- Norco 10/325mg prescribed for pain (14-day supply)
- Flexeril 10mg for muscle spasm (14-day supply)
- Ice packs applied in ED
- Soft cervical collar provided

PLAN:
- Follow up with orthopedics within 1 week
- Physical therapy referral
- Return to ED if symptoms worsen

ED CHARGES: $3,450.00

---

ORTHOPEDIC SPECIALISTS OF CALIFORNIA
Follow-Up Visit Note

Patient: Rodriguez, John M.
Date: March 22, 2024
Provider: Dr. Jennifer Chen, MD Orthopedic Surgery

ASSESSMENT:
Cervical and lumbar strain from MVA. Patient reports ongoing neck stiffness and lower back
pain rated 6/10. Pain worse in morning and with prolonged sitting/standing.

PLAN:
- Prescribe 12 sessions of physical therapy
- Continue pain management as needed
- MRI if no improvement in 6 weeks
- Work restrictions: No lifting >10 lbs, modified duty

OFFICE VISIT CHARGE: $350.00

---

BAYSIDE PHYSICAL THERAPY
Treatment Summary

Patient: Rodriguez, John M.
Dates of Service: March 25 - May 20, 2024
Total Sessions: 12

Treatment modalities:
- Manual therapy
- Therapeutic exercises
- Electrical stimulation
- Heat/ice therapy

Progress: Patient shows moderate improvement. Cervical ROM increased from 40% to 75% of normal.
Lumbar pain decreased from 6/10 to 3/10. Discharged with home exercise program.

TOTAL PT CHARGES: $2,400.00 ($200/session x 12)

---

ORTHOPEDIC SPECIALISTS - FINAL VISIT
Date: May 27, 2024

Patient at maximum medical improvement. Released to full duty. May experience intermittent
discomfort with weather changes or prolonged activity. No permanent restrictions.

FINAL VISIT CHARGE: $250.00

---

MEDICATION COSTS:
- Norco prescription (2 refills): $45
- Flexeril prescription (2 refills): $35
- OTC pain relievers: $25

TOTAL MEDICAL EXPENSES: $6,555.00

Additional expenses from pharmacy records: $12,000 for specialized imaging and injections
GRAND TOTAL MEDICAL: $18,450.00
```

---

### 2. Police Accident Report PDF Content

**File Name:** `Police_Report_MVA_2024_03_15.pdf`

```
CITY OF SAN FRANCISCO POLICE DEPARTMENT
TRAFFIC COLLISION REPORT

Report Number: 2024-SF-12847
Date/Time of Collision: March 15, 2024 at 14:35 hours
Location: Intersection of Main Street & Oak Avenue, San Francisco, CA

REPORTING OFFICER: Officer Michael Torres, Badge #4521

VEHICLE 1 (Victim):
Driver: Rodriguez, John M.
Address: 456 Elm Street, San Francisco, CA 94110
Vehicle: 2022 Honda Accord, CA License: 8ABC123
Insurance: State Farm, Policy #SF-445566

VEHICLE 2 (At-Fault):
Driver: Smith, Michael R.
Address: 789 Pine Street, San Francisco, CA 94115
Vehicle: 2019 Ford F-150, CA License: 7XYZ789
Insurance: Allstate, Policy #AL-998877

NARRATIVE:
On March 15, 2024, at approximately 1435 hours, I responded to a traffic collision at the
intersection of Main Street and Oak Avenue.

Upon arrival, I observed two vehicles in the intersection. Vehicle 1 (Honda Accord) sustained
moderate rear-end damage. Vehicle 2 (Ford F-150) sustained front-end damage to bumper and
grille.

WITNESS STATEMENTS:
Driver Rodriguez (V1) stated he was stopped at the red traffic signal facing northbound on Main
Street when he felt a sudden impact from behind. He stated the collision was unexpected and he
had been stopped for approximately 10-15 seconds.

Driver Smith (V2) stated he was traveling northbound on Main Street approaching Oak Avenue. He
admitted he did not see Vehicle 1 stopped in time and applied brakes but could not stop before
impact. Mr. Smith estimated his speed at 35 mph at time of collision. Mr. Smith stated he was
"distracted for a moment" when looking at his phone navigation.

Independent witness Jennifer Martinez (456 Oak Ave) stated she observed the collision from
sidewalk. She confirmed Vehicle 1 was stopped at red light and Vehicle 2 failed to stop,
striking Vehicle 1 from behind.

TRAFFIC CONTROL: Traffic signal operational, displaying red for northbound Main Street traffic

ROAD CONDITIONS: Dry pavement, clear weather, good visibility

EVIDENCE:
- Photographed: Vehicle damage, skid marks, final rest positions
- Measured: 15 feet of skid marks from Vehicle 2
- Debris field indicating point of impact

DRIVER 1 INJURIES: Complaint of neck and back pain, transported to Pacific Medical Center by
private vehicle (declined ambulance)

DRIVER 2 INJURIES: None

CONTRIBUTING FACTORS: Driver inattention (V2), following too close (V2)

CITATIONS ISSUED:
Michael R. Smith (V2) - CVC 21703: Following too closely
Michael R. Smith (V2) - CVC 23123: Wireless device usage while driving

FAULT DETERMINATION: 100% fault assigned to Driver Smith (V2) for failure to maintain safe
following distance and driver inattention.

VEHICLE DISPOSITION:
- Vehicle 1: Driven from scene
- Vehicle 2: Driven from scene

Officer M. Torres #4521
Traffic Division
San Francisco Police Department
```

---

### 3. Wage Loss Statement DOCX Content

**File Name:** `Wage_Loss_Rodriguez.docx`

```
TECH SOLUTIONS INC.
Human Resources Department
1000 Innovation Drive, San Francisco, CA 94105
Phone: (415) 555-0199

Date: June 1, 2024

TO WHOM IT MAY CONCERN:

RE: Wage Loss Verification for John M. Rodriguez

This letter confirms that John M. Rodriguez has been employed by Tech Solutions Inc. as a
Senior Software Engineer since January 2020.

Due to injuries sustained in a motor vehicle accident on March 15, 2024, Mr. Rodriguez was
unable to work for the following periods:

March 15, 2024 - March 29, 2024: Full medical leave (2 weeks)
March 30, 2024 - April 26, 2024: Modified duty, work from home 50% capacity (4 weeks)

WAGE LOSS CALCULATION:

Base Salary: $125,000 annually
Weekly Salary: $2,403.85 ($125,000 ÷ 52 weeks)

Full Leave Period (2 weeks):
$2,403.85 x 2 = $4,807.70

Modified Duty Period (4 weeks at 50% productivity loss):
$2,403.85 x 0.50 x 4 = $4,807.70

TOTAL WAGE LOSS: $9,615.40

Additionally, Mr. Rodriguez exhausted 48 hours of accrued paid time off (PTO) to cover the
initial leave period, which represents lost personal time valued at approximately $2,884.62.

Mr. Rodriguez returned to full duty on April 27, 2024, with no current restrictions.

If you require additional information, please contact our HR department at (415) 555-0199.

Sincerely,

[Signature]
Maria Gonzalez
Director of Human Resources
Tech Solutions Inc.

Enclosures: Pay stubs for March-April 2024, PTO balance statements
```

---

### 4. Vehicle Damage Photo

**File Name:** `Vehicle_Damage_Rodriguez.jpg`

**Description for Demo:**
Use a stock photo or create a simple image showing:
- Rear bumper of a silver Honda Accord
- Visible damage: Crushed bumper, trunk misalignment, broken taillight
- Clearly rear-end collision damage
- License plate visible (blur in real production)

**Where to source:**
- Stock photo sites: Shutterstock, Getty Images (search "rear end collision damage")
- Free alternatives: Unsplash, Pexels (search "car accident rear damage")
- Or use a simple diagram/illustration

---

## Pre-Populated Variable Values for Demo

When filling out the variables form during the demo, use these values:

| Variable | Value |
|----------|-------|
| **Plaintiff Name** | John Rodriguez |
| **Defendant Name** | Michael Smith |
| **Incident Date** | March 15, 2024 |
| **Injury Description** | Cervical sprain/strain, lumbar contusion |
| **Total Medical Expenses** | $18,450.00 |
| **Settlement Demand Amount** | $75,000.00 |

**Demand Amount Rationale (if asked):**
- Medical expenses: $18,450
- Wage loss: $9,615
- Future medical (potential): $5,000
- Pain & suffering: $35,000 (2x specials)
- Property damage: $4,500
- Misc expenses: $2,435
- **Total: $75,000**

This represents a reasonable 3-4x medical specials multiplier typical for soft tissue injury cases with clear liability.

---

## Quick Seed Script for Demo (Alternative)

If you prefer to seed via application instead of SQL:

1. **Run the app seed command:**
```bash
pnpm db:seed
```

2. **Manually create accounts via UI:**
   - Navigate to `/signup`
   - Create Firm: "Miller & Associates Law"
   - Create user: sarah@millerlaw.com / Demo2024!
   - Repeat for james@millerlaw.com and lisa@millerlaw.com

3. **Create Personal Injury template via UI:**
   - Login as Sarah
   - Navigate to `/templates/new`
   - Copy/paste section configurations from SQL above
   - Save and publish

---

## Document Download Checklist

Before demo, ensure you have:

- [ ] Medical_Records_Rodriguez_John.pdf (created from template above)
- [ ] Police_Report_MVA_2024_03_15.pdf (created from template above)
- [ ] Wage_Loss_Rodriguez.docx (created from template above)
- [ ] Vehicle_Damage_Rodriguez.jpg (downloaded from stock photos)
- [ ] All files saved in easily accessible folder (Desktop/Demo_Documents)
- [ ] Files tested for successful upload (no corruption)
- [ ] PDF files are searchable (OCR embedded) for better text extraction

---

## Test Upload Before Demo

**30 minutes before demo:**

1. Login as Sarah
2. Create test project: "Test - Delete Before Demo"
3. Upload all 4 documents
4. Verify extraction status shows "Completed"
5. Verify extracted text preview looks correct
6. Delete test project
7. Confirm documents actually generated draft correctly

This ensures:
- S3 upload working
- Text extraction working
- OCR working on image
- AI generation working
- No surprises during live demo

---

## Troubleshooting Common Issues

**Issue: Text extraction fails**
- Solution: Ensure PDFs are not password-protected or image-only scans
- Have backup documents with embedded text

**Issue: OCR takes too long on image**
- Solution: Use smaller image file (<2MB) or pre-process with better quality

**Issue: AI generation returns error**
- Solution: Check Anthropic API key is valid and has credits
- Have backup pre-generated project ready

**Issue: WebSocket disconnects during collab demo**
- Solution: Ensure stable Wi-Fi, have users reconnect, or use wired connection

**Issue: Second browser won't login**
- Solution: Use incognito/private mode or different browser entirely
- Clear cookies before demo

---

## Pro Tips

1. **Name files clearly:** Use descriptive names so drag-and-drop is smooth
2. **Test on target screen resolution:** Ensure UI elements visible in presentation mode
3. **Zoom browser to 110%:** Makes text more readable for audience
4. **Hide browser bookmarks:** Cleaner presentation
5. **Close unnecessary tabs:** Reduce distractions
6. **Use two monitors:** One for demo, one for notes
7. **Have backup internet:** Mobile hotspot as failover
8. **Record practice run:** Identify timing issues
9. **Prepare 3-minute version:** In case you need to cut short
10. **Have business cards ready:** For immediate follow-up requests
