/**
 * Sample Test Cases for Prompt Quality Testing
 *
 * These cases represent realistic scenarios for each prompt type.
 * Used to validate prompt output quality and token usage.
 */

import { PersonalInjuryVariables } from '../personal-injury-demand';
import { ContractDisputeVariables } from '../contract-dispute-demand';
import { PromptVariables } from '../base-demand-letter';

// Sample template structure (simplified)
export const basicTemplate = {
  name: 'Basic Demand Letter',
  sections: [
    { id: '1', title: 'Introduction', required: true },
    { id: '2', title: 'Facts of the Case', required: true },
    { id: '3', title: 'Liability', required: true },
    { id: '4', title: 'Damages', required: true },
    { id: '5', title: 'Demand', required: true },
    { id: '6', title: 'Conclusion', required: true },
  ],
};

// ===== PERSONAL INJURY TEST CASES =====

export const autoAccidentCase: PersonalInjuryVariables = {
  plaintiffName: 'John Smith',
  defendantName: 'Jane Doe',
  incidentDate: '2024-01-15',
  incidentDescription: 'Rear-end collision at intersection of Main St and Oak Ave',
  injuryType: 'Whiplash, cervical strain, lumbar contusion',
  medicalProviders: [
    'County Hospital Emergency Room - Dr. Sarah Johnson',
    'Orthopedic Specialists - Dr. Michael Lee',
    'Physical Therapy Center - Lisa Martinez, PT',
  ],
  totalMedicalExpenses: '$18,450',
  lostWages: '$3,200',
  demandAmount: '$65,000',
  jurisdiction: 'California',
};

export const autoAccidentSourceDocs = `
EMERGENCY ROOM REPORT
County Hospital Emergency Department
Date: January 15, 2024
Patient: John Smith
DOB: 03/15/1985

Chief Complaint: Neck and back pain following motor vehicle accident

History of Present Illness: 39-year-old male presents after rear-end collision approximately 1 hour ago. Patient was stopped at red light when struck from behind by another vehicle. Immediate onset of neck pain and lower back pain. Denies loss of consciousness. Complains of headache rated 6/10.

Physical Examination:
- Cervical spine: Tenderness to palpation, limited range of motion
- Lumbar spine: Tenderness over L4-L5, muscle spasm noted
- Neurological: Alert and oriented x3, cranial nerves intact

Diagnosis:
1. Cervical strain
2. Lumbar contusion
3. Post-traumatic headache

Treatment: Prescribed muscle relaxants and pain medication. Referred to orthopedics for follow-up.

Dr. Sarah Johnson, MD
Emergency Medicine

---

ORTHOPEDIC CONSULTATION
Orthopedic Specialists of California
Date: January 22, 2024
Patient: John Smith

Consultation requested for persistent neck and back pain following MVA on 1/15/24.

Findings: MRI of cervical spine shows mild disc bulge at C5-C6 with no nerve impingement. Lumbar spine shows soft tissue injury consistent with traumatic impact.

Assessment: Post-traumatic cervical and lumbar strain with probable disc involvement at C5-C6.

Plan: Physical therapy 3x per week for 8 weeks. Re-evaluate in 6 weeks.

Dr. Michael Lee, MD
Orthopedic Surgery

---

PHYSICAL THERAPY PROGRESS NOTE
Physical Therapy Center
Date: March 1, 2024 (Session 12 of 24)
Patient: John Smith

Progress: Patient reports 40% improvement in pain levels. Still unable to perform work duties that require prolonged sitting or lifting. Reports difficulty sleeping and cannot participate in recreational activities (hiking, coaching son's soccer team).

Current pain level: 4/10 (down from 8/10)
Range of motion: Improved but still restricted
Functional limitations: Unable to lift >15 lbs, cannot sit >30 minutes

Plan: Continue therapy. Patient will likely need 12 additional sessions.

Lisa Martinez, PT, DPT

---

WAGE LOSS STATEMENT
ABC Construction Company
To Whom It May Concern:

John Smith has been employed as a Construction Supervisor since June 2020. Due to injuries sustained in the January 15, 2024 accident, Mr. Smith has been unable to perform his regular duties.

Dates missed: January 15 - February 5, 2024 (3 weeks)
Regular hourly rate: $42/hour
Total hours missed: 120 hours
Total wage loss: $5,040

Additionally, Mr. Smith has been assigned to light duty since February 6, resulting in reduced hours and income of approximately $3,200 through March 15.

Sincerely,
Robert Johnson, HR Manager
ABC Construction Company
`;

export const slipAndFallCase: PersonalInjuryVariables = {
  plaintiffName: 'Maria Garcia',
  defendantName: 'BigBox Retail Inc.',
  incidentDate: '2024-02-10',
  incidentDescription: 'Slip and fall on wet floor in produce section',
  injuryType: 'Fractured wrist, shoulder injury',
  medicalProviders: [
    'City General Hospital - Dr. Patricia Wong',
    'Hand Surgery Associates - Dr. Robert Chen',
  ],
  totalMedicalExpenses: '$24,750',
  lostWages: '$6,400',
  permanentImpairment: 'Reduced grip strength in right hand (dominant)',
  demandAmount: '$95,000',
  jurisdiction: 'Texas',
};

export const slipAndFallSourceDocs = `
INCIDENT REPORT
BigBox Retail Inc. - Store #4521
Date: February 10, 2024
Time: 2:45 PM

Customer Maria Garcia slipped and fell in produce section near refrigerated cases. Customer stated floor was wet. Store manager confirmed overhead refrigeration unit had been leaking, and maintenance was in process of cleaning when incident occurred. No warning cones were observed in area at time of fall.

Witnesses: Employee Sarah Kim (produce dept) observed fall
Customer complained of right wrist and shoulder pain
Paramedics called at 2:47 PM

Manager: Tom Stevens

---

EMERGENCY DEPARTMENT RECORD
City General Hospital
Date: February 10, 2024
Patient: Maria Garcia, DOB 07/22/1978

Chief Complaint: Right wrist and shoulder pain after fall

X-Ray Results:
- Right wrist: Displaced distal radius fracture (Colles' fracture)
- Right shoulder: No fracture visible, soft tissue injury suspected

Treatment: Wrist immobilized with splint, referral to orthopedic hand surgeon for definitive treatment. Shoulder injury to be evaluated by orthopedics.

Dr. Patricia Wong, MD

---

OPERATIVE REPORT
Hand Surgery Associates
Date: February 15, 2024
Surgeon: Dr. Robert Chen, MD

Procedure: Open reduction internal fixation (ORIF) of right distal radius fracture

The fracture was reduced and fixed with plate and screws. Postoperative plan includes 6 weeks immobilization followed by hand therapy.

Prognosis: Good for fracture healing. Patient may experience some permanent reduction in grip strength and range of motion.

---

WORK STATUS LETTER
Garcia Accounting Services
Date: March 15, 2024

Maria Garcia is self-employed as a tax accountant. Due to her dominant hand injury, she has been unable to work during tax season (our busiest period).

Estimated income loss February-April 2024: $18,500
Hours unable to work: 320 hours
`;

// ===== CONTRACT DISPUTE TEST CASES =====

export const serviceAgreementBreach: ContractDisputeVariables = {
  plaintiffName: 'TechStart Solutions LLC',
  defendantName: 'WebDesign Pro Inc.',
  incidentDate: '2024-01-01',
  incidentDescription: 'Breach of website development service agreement',
  contractDate: '2023-08-15',
  contractType: 'Website Development Service Agreement',
  breachDate: '2024-01-15',
  breachDescription: 'Failed to deliver completed website by deadline; delivered non-functional product',
  contractualDamages: '$45,000',
  demandAmount: '$75,000',
  specificPerformanceRequested: false,
  governingLaw: 'New York',
};

export const serviceAgreementSourceDocs = `
WEBSITE DEVELOPMENT SERVICE AGREEMENT
Executed: August 15, 2023
Between: TechStart Solutions LLC ("Client") and WebDesign Pro Inc. ("Vendor")

Section 3.1 - Deliverables and Timeline:
Vendor agrees to design, develop, and deliver a fully functional e-commerce website according to specifications in Exhibit A. Project completion date: December 31, 2023.

Section 3.2 - Acceptance Testing:
Client shall have 10 business days to test deliverables. Vendor must correct any defects within 5 business days of notification.

Section 5.1 - Payment Terms:
Total contract price: $45,000
Payment schedule:
- $15,000 upon signing (PAID)
- $15,000 upon milestone 1 completion (PAID)
- $15,000 upon final delivery and acceptance

Section 8.2 - Liquidated Damages:
If Vendor fails to meet completion deadline, Vendor shall pay Client $500 per day for each day of delay, not to exceed $10,000.

Section 9.1 - Governing Law:
This Agreement shall be governed by laws of the State of New York.

Section 10.3 - Attorney's Fees:
Prevailing party in any dispute shall be entitled to reasonable attorney's fees and costs.

---

EMAIL CORRESPONDENCE
From: Sarah Chen, TechStart Solutions
To: Mike Johnson, WebDesign Pro
Date: December 15, 2023
Subject: Project Status - Deadline Approaching

Mike,

With 2 weeks until the December 31 deadline, I wanted to check on project status. Our team needs the site operational by January 1 for our product launch. Can you confirm you're on track?

Sarah

---

From: Mike Johnson, WebDesign Pro
To: Sarah Chen
Date: December 20, 2023

Sarah, we've run into some technical issues but should have something for you by mid-January. Will keep you posted.

Mike

---

From: Sarah Chen
To: Mike Johnson
Date: December 28, 2023

Mike - "mid-January" is not acceptable. Our contract clearly states December 31 completion. This delay will cost us significant revenue during our launch period. Please confirm delivery date.

Sarah

---

DELIVERY EMAIL
From: Mike Johnson
To: Sarah Chen
Date: January 15, 2024

Sarah,

Attached is the completed website. Sorry for the delay.

Mike

---

TESTING RESULTS - INTERNAL MEMO
TechStart Solutions
Date: January 20, 2024

Testing of website delivered by WebDesign Pro reveals multiple critical defects:
1. Shopping cart functionality non-operational
2. Payment gateway integration incomplete
3. Mobile responsive design not implemented per specifications
4. Site crashes when more than 50 products loaded

Site is NOT functional and cannot be used for production launch.

We notified WebDesign Pro of defects on January 22. As of January 29, no corrections have been provided.

Due to delay, we hired alternate vendor (QuickWeb Solutions) to complete project. Cost: $35,000. Completed February 28.

Lost revenue from delayed launch (January-February): estimated $40,000 based on sales projections.
`;

export const purchaseAgreementBreach: ContractDisputeVariables = {
  plaintiffName: 'Mountain Coffee Roasters',
  defendantName: 'Global Coffee Importers LLC',
  incidentDate: '2023-06-01',
  incidentDescription: 'Breach of coffee bean purchase agreement',
  contractDate: '2023-06-01',
  contractType: 'Purchase Agreement for Coffee Beans',
  breachDate: '2023-07-15',
  breachDescription: 'Failed to deliver contracted quantity; delivered inferior grade beans',
  contractualDamages: '$125,000',
  demandAmount: '$125,000',
  governingLaw: 'Oregon - UCC Article 2',
};

export const purchaseAgreementSourceDocs = `
PURCHASE AGREEMENT
Date: June 1, 2023
Buyer: Mountain Coffee Roasters ("Buyer")
Seller: Global Coffee Importers LLC ("Seller")

Goods: 10,000 pounds of Colombian Supremo green coffee beans, Grade A

Price: $8.50 per pound, Total: $85,000

Delivery: On or before July 15, 2023, to Buyer's facility in Portland, Oregon

Quality: Beans must meet SCAA Grade A standards. Buyer has right to inspect and reject non-conforming goods within 48 hours of delivery.

This agreement is governed by the Uniform Commercial Code as adopted in Oregon.

Payment Terms: Net 30 days from delivery and acceptance

---

DELIVERY RECEIPT
Date: July 18, 2023 (3 days late)

Delivered: 10,000 pounds coffee beans from Global Coffee Importers
Received by: Maria Rodriguez, Warehouse Manager
Signed for receipt (subject to inspection)

---

INSPECTION REPORT - INTERNAL
Mountain Coffee Roasters
Date: July 19, 2023
Inspector: Carlos Martinez, Head Roaster

Sample testing reveals beans are NOT Grade A quality:
- Bean size inconsistent (mix of Supremo and Excelso grades)
- Defect rate: 12% (Grade A standard is <5%)
- Moisture content: 13.5% (should be 10-12%)
- Off odors detected suggesting improper storage

Conclusion: Beans DO NOT meet contract specifications. Not suitable for our premium coffee line.

---

EMAIL - REJECTION NOTICE
From: Mountain Coffee Roasters
To: Global Coffee Importers
Date: July 20, 2023

We hereby reject the coffee bean shipment delivered July 18 as non-conforming to our June 1 purchase agreement. Beans do not meet Grade A standards as contracted.

Per UCC Section 2-601, we exercise our right to reject the entire shipment. Please arrange pickup of rejected goods and provide conforming goods or issue full refund.

We are entitled to cover under UCC 2-712.

---

COVER PURCHASE - INVOICE
Date: July 25, 2023
From: Premium Coffee Suppliers Inc.
To: Mountain Coffee Roasters

Emergency purchase to fulfill customer orders:
10,000 lbs Colombian Supremo, Grade A
Price: $11.00 per pound (premium due to short notice)
Total: $110,000

---

CALCULATION OF DAMAGES
Cost of cover: $110,000
Less: Contract price: $85,000
Cover damages: $25,000

Incidental damages:
- Additional shipping costs: $2,500
- Testing and inspection: $500
- Storage of rejected goods: $800
Total incidental: $3,800

Lost profits from delayed fulfillment of customer orders: $15,000

Total Damages: $44,300
`;

// ===== BASE PROMPT TEST CASES =====

export const propertyDamageCase: PromptVariables = {
  plaintiffName: 'Robert Wilson',
  defendantName: 'Ace Plumbing Services',
  incidentDate: '2024-03-01',
  incidentDescription: 'Negligent plumbing repair caused water damage to home',
  demandAmount: '$28,500',
  jurisdiction: 'Washington',
};

export const propertyDamageSourceDocs = `
PLUMBING SERVICE INVOICE
Ace Plumbing Services
Date: March 1, 2024
Customer: Robert Wilson
123 Pine Street, Seattle, WA

Work Performed: Replace kitchen sink faucet and garbage disposal
Labor: $350
Parts: $180
Total: $530

Technician: Joe Smith
"Guarantee: All work guaranteed for 30 days"

---

INCIDENT DESCRIPTION - HOMEOWNER STATEMENT
Date: March 3, 2024

On March 2, 2024 (day after plumbing work), I discovered water leaking from under the kitchen sink. The leak had caused significant water damage to the kitchen floor, cabinet, and had leaked into the basement below.

I immediately called Ace Plumbing (Joe Smith's cell phone) but received no answer. Left voicemail requesting emergency callback. No response received.

I was forced to call different plumber (FastFix Plumbing) who came same day and discovered that the supply line connections installed by Ace Plumbing were not properly tightened, causing the leak.

---

REPAIR INVOICE - FASTFIX PLUMBING
Date: March 2, 2024

Emergency service call: $250
Tightened supply line connections
Identified improper installation as cause of leak

---

RESTORATION INVOICE
DryRight Water Damage Restoration
Date: March 8, 2024

Water extraction and drying: $2,800
Remove damaged drywall (basement ceiling): $1,200
Cabinet restoration: $3,500
Hardwood floor repair: $4,200
Labor: $3,800
Total: $15,500

Cause of damage: Plumbing leak from improperly installed supply lines

---

PHOTOS - WATER DAMAGE
[Photos show extensive water damage to kitchen floor, cabinet base, and basement ceiling. Visible water stains and warped wood flooring.]
`;

// Export test case data structure for automated testing
export interface TestCase {
  name: string;
  promptType: 'base' | 'personal-injury' | 'contract-dispute';
  variables: any;
  sourceDocuments: string;
  template: any;
}

export const allTestCases: TestCase[] = [
  {
    name: 'Auto Accident - Personal Injury',
    promptType: 'personal-injury',
    variables: autoAccidentCase,
    sourceDocuments: autoAccidentSourceDocs,
    template: basicTemplate,
  },
  {
    name: 'Slip and Fall - Personal Injury',
    promptType: 'personal-injury',
    variables: slipAndFallCase,
    sourceDocuments: slipAndFallSourceDocs,
    template: basicTemplate,
  },
  {
    name: 'Service Agreement Breach - Contract',
    promptType: 'contract-dispute',
    variables: serviceAgreementBreach,
    sourceDocuments: serviceAgreementSourceDocs,
    template: basicTemplate,
  },
  {
    name: 'Purchase Agreement Breach - Contract',
    promptType: 'contract-dispute',
    variables: purchaseAgreementBreach,
    sourceDocuments: purchaseAgreementSourceDocs,
    template: basicTemplate,
  },
  {
    name: 'Property Damage - Base Prompt',
    promptType: 'base',
    variables: propertyDamageCase,
    sourceDocuments: propertyDamageSourceDocs,
    template: basicTemplate,
  },
];
