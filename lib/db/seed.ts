import { db } from './client';
import { firms, users, templates, templateVersions, projects, drafts, sourceDocuments, comments, draftSnapshots } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Check if data already exists
    const existingFirms = await db.select().from(firms);
    if (existingFirms.length > 0) {
      console.log('⚠️  Database already contains data. Clearing existing data...\n');
      // Clear in correct order due to foreign key constraints (most dependent first)
      await db.delete(comments);
      await db.delete(draftSnapshots);
      await db.delete(drafts);
      await db.delete(sourceDocuments);
      await db.delete(projects);
      await db.delete(templates);
      await db.delete(users);
      await db.delete(firms);
      console.log('✓ Cleared existing data\n');
    }

    // Hash password once (all users will use the same hash for dev)
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Firms
    console.log('Creating firms...');
    const [smithFirm, johnsonFirm, davisFirm] = await db.insert(firms).values([
      { name: 'Smith & Associates Law Firm' },
      { name: 'Johnson Legal Group' },
      { name: 'Davis & Partners LLP' },
    ]).returning();
    console.log(`✓ Created ${3} firms`);
    console.log(`  - ${smithFirm.name} (${smithFirm.id})`);
    console.log(`  - ${johnsonFirm.name} (${johnsonFirm.id})`);
    console.log(`  - ${davisFirm.name} (${davisFirm.id})\n`);

    // Create Users for Smith & Associates
    console.log('Creating users for Smith & Associates...');
    const smithUsers = await db.insert(users).values([
      {
        email: 'admin@smithlaw.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Smith',
        role: 'admin',
        firmId: smithFirm.id,
      },
      {
        email: 'attorney@smithlaw.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Mitchell',
        role: 'attorney',
        firmId: smithFirm.id,
      },
      {
        email: 'paralegal@smithlaw.com',
        passwordHash,
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'paralegal',
        firmId: smithFirm.id,
      },
    ]).returning();
    console.log(`✓ Created ${smithUsers.length} users for Smith & Associates\n`);

    // Create Users for Johnson Legal Group
    console.log('Creating users for Johnson Legal Group...');
    const johnsonUsers = await db.insert(users).values([
      {
        email: 'admin@johnsonlegal.com',
        passwordHash,
        firstName: 'Emily',
        lastName: 'Johnson',
        role: 'admin',
        firmId: johnsonFirm.id,
      },
      {
        email: 'attorney@johnsonlegal.com',
        passwordHash,
        firstName: 'David',
        lastName: 'Rodriguez',
        role: 'attorney',
        firmId: johnsonFirm.id,
      },
      {
        email: 'paralegal@johnsonlegal.com',
        passwordHash,
        firstName: 'Amanda',
        lastName: 'Williams',
        role: 'paralegal',
        firmId: johnsonFirm.id,
      },
    ]).returning();
    console.log(`✓ Created ${johnsonUsers.length} users for Johnson Legal Group\n`);

    // Create Users for Davis & Partners
    console.log('Creating users for Davis & Partners...');
    const davisUsers = await db.insert(users).values([
      {
        email: 'admin@davislegal.com',
        passwordHash,
        firstName: 'Robert',
        lastName: 'Davis',
        role: 'admin',
        firmId: davisFirm.id,
      },
      {
        email: 'attorney@davislegal.com',
        passwordHash,
        firstName: 'Jennifer',
        lastName: 'Thompson',
        role: 'attorney',
        firmId: davisFirm.id,
      },
    ]).returning();
    console.log(`✓ Created ${davisUsers.length} users for Davis & Partners\n`);

    // Create system templates for each firm
    console.log('Creating system templates for all firms...');

    // Helper function to create templates for a firm
    const createTemplatesForFirm = (firmId: string, createdBy: string) => {
      // Personal Injury Demand Letter Template
      const personalInjuryTemplate = {
        name: 'Personal Injury Demand Letter',
        description: 'Comprehensive template for personal injury claims with medical expenses, lost wages, and pain and suffering damages',
        isActive: true,
        isSystemTemplate: true,
        sections: [
        {
          id: 'intro',
          title: 'Introduction',
          type: 'static',
          content: 'Dear {{defendant_name}},\n\nThis letter serves as a formal demand for compensation on behalf of my client, {{plaintiff_name}}, arising from injuries sustained in an incident that occurred on {{incident_date}}.',
          promptGuidance: null,
          required: true,
          order: 1,
        },
        {
          id: 'facts',
          title: 'Statement of Facts',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Generate a detailed chronological narrative of the accident based on the source documents. Include specific details about the location, time, weather conditions, and sequence of events leading to the injury. Emphasize facts that establish defendant liability.',
          required: true,
          order: 2,
        },
        {
          id: 'liability',
          title: 'Liability Analysis',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Analyze how the defendant breached their duty of care and how this breach directly caused the plaintiff\'s injuries. Reference applicable legal standards and cite relevant case law or statutes if available in the source documents.',
          required: true,
          order: 3,
        },
        {
          id: 'injuries',
          title: 'Nature and Extent of Injuries',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Describe the plaintiff\'s injuries in detail based on medical records. Include diagnoses, treatment received, ongoing care requirements, and prognosis. Use medical terminology appropriately while remaining understandable.',
          required: true,
          order: 4,
        },
        {
          id: 'medical_expenses',
          title: 'Medical Expenses',
          type: 'variable',
          content: 'Total medical expenses incurred to date: {{medical_expenses}}\n\nEstimated future medical expenses: {{future_medical_expenses}}',
          promptGuidance: null,
          required: true,
          order: 5,
        },
        {
          id: 'lost_wages',
          title: 'Lost Wages and Loss of Earning Capacity',
          type: 'variable',
          content: 'Lost wages to date: {{lost_wages}}\n\nEstimated future loss of earning capacity: {{future_lost_earnings}}',
          promptGuidance: null,
          required: false,
          order: 6,
        },
        {
          id: 'pain_suffering',
          title: 'Pain and Suffering',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Describe the plaintiff\'s pain, suffering, emotional distress, and impact on quality of life. Include specific examples of activities the plaintiff can no longer perform, relationships affected, and psychological impact. Make this section compelling and humanizing.',
          required: true,
          order: 7,
        },
        {
          id: 'damages_summary',
          title: 'Summary of Damages',
          type: 'variable',
          content: 'Medical Expenses: {{medical_expenses}}\nFuture Medical Expenses: {{future_medical_expenses}}\nLost Wages: {{lost_wages}}\nFuture Lost Earnings: {{future_lost_earnings}}\nPain and Suffering: {{pain_suffering_amount}}\n\nTOTAL DEMAND: {{total_demand}}',
          promptGuidance: null,
          required: true,
          order: 8,
        },
        {
          id: 'demand',
          title: 'Settlement Demand',
          type: 'static',
          content: 'Based on the foregoing, we demand settlement in the amount of {{total_demand}} to fully compensate {{plaintiff_name}} for all damages sustained. We request your response within 30 days of receipt of this letter. Failure to respond or provide a reasonable settlement offer will leave us no choice but to file suit to protect our client\'s rights.',
          promptGuidance: null,
          required: true,
          order: 9,
        },
        {
          id: 'closing',
          title: 'Closing',
          type: 'static',
          content: 'Please direct all correspondence to my attention.\n\nSincerely,\n\n{{attorney_name}}\n{{firm_name}}',
          promptGuidance: null,
          required: true,
          order: 10,
        },
      ],
      variables: [
        { name: 'plaintiff_name', type: 'text', required: true, defaultValue: null },
        { name: 'defendant_name', type: 'text', required: true, defaultValue: null },
        { name: 'incident_date', type: 'date', required: true, defaultValue: null },
        { name: 'medical_expenses', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'future_medical_expenses', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'lost_wages', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'future_lost_earnings', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'pain_suffering_amount', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'total_demand', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'attorney_name', type: 'text', required: true, defaultValue: null },
        { name: 'firm_name', type: 'text', required: true, defaultValue: null },
      ],
      firmId,
      createdBy,
    };

    // Contract Dispute Demand Letter Template
    const contractDisputeTemplate = {
      name: 'Contract Dispute Demand Letter',
      description: 'Template for breach of contract claims demanding performance or damages',
      isActive: true,
      isSystemTemplate: true,
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          type: 'static',
          content: 'Dear {{defendant_name}},\n\nThis letter constitutes formal notice of breach of contract and demand for relief on behalf of my client, {{plaintiff_name}}, concerning the {{contract_type}} entered into on {{contract_date}}.',
          promptGuidance: null,
          required: true,
          order: 1,
        },
        {
          id: 'contract_summary',
          title: 'Contract Summary',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Summarize the key terms of the contract including parties, subject matter, consideration, performance obligations, and relevant timelines. Reference specific contract provisions and section numbers where applicable.',
          required: true,
          order: 2,
        },
        {
          id: 'performance',
          title: 'Plaintiff\'s Performance',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Detail how the plaintiff fully performed their obligations under the contract or was ready, willing, and able to perform. Include dates, deliverables, payments made, and any other relevant performance facts.',
          required: true,
          order: 3,
        },
        {
          id: 'breach',
          title: 'Defendant\'s Breach',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Clearly identify the specific contractual obligations the defendant failed to perform. Include dates, missed deadlines, defective performance, or repudiation. Be specific about what was promised versus what was (or was not) delivered.',
          required: true,
          order: 4,
        },
        {
          id: 'notice',
          title: 'Notice and Opportunity to Cure',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'If applicable, describe any prior notices given to the defendant about the breach and any cure periods that have expired. If no notice was required under the contract, explain why.',
          required: false,
          order: 5,
        },
        {
          id: 'damages',
          title: 'Damages',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Detail the damages plaintiff has suffered as a direct result of defendant\'s breach. Include expectation damages, consequential damages, incidental damages, and any other recoverable losses. Provide specific dollar amounts where possible.',
          required: true,
          order: 6,
        },
        {
          id: 'damages_summary',
          title: 'Summary of Damages',
          type: 'variable',
          content: 'Direct Damages: {{direct_damages}}\nConsequential Damages: {{consequential_damages}}\nIncidental Costs: {{incidental_costs}}\nLost Profits: {{lost_profits}}\n\nTOTAL DAMAGES: {{total_damages}}',
          promptGuidance: null,
          required: true,
          order: 7,
        },
        {
          id: 'demand',
          title: 'Demand for Relief',
          type: 'static',
          content: 'We demand that you {{remedy_sought}} within {{response_deadline}} days of receipt of this letter. Alternatively, if you are unwilling or unable to perform, we demand payment of {{total_damages}} as full compensation for damages caused by your breach.\n\nIf we do not receive a satisfactory response by the deadline, we will proceed with litigation and will seek to recover all damages, court costs, and attorney fees as provided under the contract and applicable law.',
          promptGuidance: null,
          required: true,
          order: 8,
        },
        {
          id: 'closing',
          title: 'Closing',
          type: 'static',
          content: 'Please direct all correspondence to my attention.\n\nSincerely,\n\n{{attorney_name}}\n{{firm_name}}',
          promptGuidance: null,
          required: true,
          order: 9,
        },
      ],
      variables: [
        { name: 'plaintiff_name', type: 'text', required: true, defaultValue: null },
        { name: 'defendant_name', type: 'text', required: true, defaultValue: null },
        { name: 'contract_type', type: 'text', required: true, defaultValue: null },
        { name: 'contract_date', type: 'date', required: true, defaultValue: null },
        { name: 'direct_damages', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'consequential_damages', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'incidental_costs', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'lost_profits', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'total_damages', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'remedy_sought', type: 'text', required: true, defaultValue: 'perform your contractual obligations' },
        { name: 'response_deadline', type: 'number', required: true, defaultValue: '30' },
        { name: 'attorney_name', type: 'text', required: true, defaultValue: null },
        { name: 'firm_name', type: 'text', required: true, defaultValue: null },
      ],
      firmId,
      createdBy,
    };

    // Property Damage Demand Letter Template
    const propertyDamageTemplate = {
      name: 'Property Damage Demand Letter',
      description: 'Template for property damage claims including repair costs, diminished value, and loss of use',
      isActive: true,
      isSystemTemplate: true,
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          type: 'static',
          content: 'Dear {{defendant_name}},\n\nThis letter constitutes formal notice of property damage and demand for compensation on behalf of my client, {{plaintiff_name}}, for damages to {{property_type}} that occurred on {{incident_date}}.',
          promptGuidance: null,
          required: true,
          order: 1,
        },
        {
          id: 'incident_description',
          title: 'Incident Description',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Provide a detailed description of how the property damage occurred. Include the date, time, location, and circumstances. Describe the condition of the property before and after the incident. Be specific about the cause of the damage and the defendant\'s role or responsibility.',
          required: true,
          order: 2,
        },
        {
          id: 'liability',
          title: 'Liability',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Explain why the defendant is legally responsible for the property damage. This may include negligence, breach of contract, trespass, or other legal theories. Reference any applicable laws, regulations, or contractual obligations.',
          required: true,
          order: 3,
        },
        {
          id: 'property_damage_details',
          title: 'Nature and Extent of Property Damage',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Detail the specific damage to the property. Include expert assessments, inspection reports, or contractor estimates if available in source documents. Describe structural damage, cosmetic damage, functional impairment, and any safety hazards created.',
          required: true,
          order: 4,
        },
        {
          id: 'repair_costs',
          title: 'Repair and Restoration Costs',
          type: 'variable',
          content: 'Estimated repair costs: {{repair_costs}}\n\nReplacement costs (if applicable): {{replacement_costs}}\n\nEmergency mitigation costs: {{emergency_costs}}',
          promptGuidance: null,
          required: true,
          order: 5,
        },
        {
          id: 'diminished_value',
          title: 'Diminished Value',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'If applicable, explain how the property has suffered diminished value even after repairs. This is particularly relevant for vehicles and real estate. Include any appraisal or valuation evidence from source documents.',
          required: false,
          order: 6,
        },
        {
          id: 'loss_of_use',
          title: 'Loss of Use',
          type: 'variable',
          content: 'Rental expenses during repair period: {{rental_expenses}}\n\nLoss of business income (if commercial property): {{lost_income}}\n\nDuration of loss of use: {{loss_duration}} days',
          promptGuidance: null,
          required: false,
          order: 7,
        },
        {
          id: 'additional_damages',
          title: 'Additional Damages',
          type: 'ai_generated',
          content: null,
          promptGuidance: 'Describe any additional damages such as damage to personal property inside the premises, costs to store or move belongings, or other consequential damages. Be specific about amounts and how they resulted from the property damage.',
          required: false,
          order: 8,
        },
        {
          id: 'damages_summary',
          title: 'Summary of Damages',
          type: 'variable',
          content: 'Repair Costs: {{repair_costs}}\nReplacement Costs: {{replacement_costs}}\nEmergency Costs: {{emergency_costs}}\nDiminished Value: {{diminished_value}}\nRental/Loss of Use: {{rental_expenses}}\nLost Income: {{lost_income}}\nAdditional Damages: {{additional_damages}}\n\nTOTAL DEMAND: {{total_demand}}',
          promptGuidance: null,
          required: true,
          order: 9,
        },
        {
          id: 'demand',
          title: 'Settlement Demand',
          type: 'static',
          content: 'We demand payment of {{total_demand}} to fully compensate {{plaintiff_name}} for all property damage sustained. This demand must be satisfied within {{response_deadline}} days of receipt of this letter.\n\nIf we do not receive payment or a reasonable settlement proposal within the specified time, we will pursue all available legal remedies, including filing a lawsuit for damages, court costs, and attorney fees.',
          promptGuidance: null,
          required: true,
          order: 10,
        },
        {
          id: 'closing',
          title: 'Closing',
          type: 'static',
          content: 'Please direct all correspondence and payments to my attention.\n\nSincerely,\n\n{{attorney_name}}\n{{firm_name}}',
          promptGuidance: null,
          required: true,
          order: 11,
        },
      ],
      variables: [
        { name: 'plaintiff_name', type: 'text', required: true, defaultValue: null },
        { name: 'defendant_name', type: 'text', required: true, defaultValue: null },
        { name: 'property_type', type: 'text', required: true, defaultValue: null },
        { name: 'incident_date', type: 'date', required: true, defaultValue: null },
        { name: 'repair_costs', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'replacement_costs', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'emergency_costs', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'diminished_value', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'rental_expenses', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'lost_income', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'loss_duration', type: 'number', required: false, defaultValue: '0' },
        { name: 'additional_damages', type: 'currency', required: false, defaultValue: '0.00' },
        { name: 'total_demand', type: 'currency', required: true, defaultValue: '0.00' },
        { name: 'response_deadline', type: 'number', required: true, defaultValue: '30' },
        { name: 'attorney_name', type: 'text', required: true, defaultValue: null },
        { name: 'firm_name', type: 'text', required: true, defaultValue: null },
      ],
      firmId,
      createdBy,
    };

    return [personalInjuryTemplate, contractDisputeTemplate, propertyDamageTemplate];
  };

    // Create templates for Smith & Associates
    const smithTemplates = createTemplatesForFirm(smithFirm.id, smithUsers[0].id);
    const smithTemplateResults = await db.insert(templates).values(smithTemplates).returning();
    console.log(`✓ Created ${smithTemplateResults.length} templates for Smith & Associates`);
    smithTemplateResults.forEach(t => console.log(`  - ${t.name} (${t.id})`));
    console.log('');

    // Create templates for Johnson Legal Group
    const johnsonTemplates = createTemplatesForFirm(johnsonFirm.id, johnsonUsers[0].id);
    const johnsonTemplateResults = await db.insert(templates).values(johnsonTemplates).returning();
    console.log(`✓ Created ${johnsonTemplateResults.length} templates for Johnson Legal Group`);
    johnsonTemplateResults.forEach(t => console.log(`  - ${t.name} (${t.id})`));
    console.log('');

    // Create templates for Davis & Partners
    const davisTemplates = createTemplatesForFirm(davisFirm.id, davisUsers[0].id);
    const davisTemplateResults = await db.insert(templates).values(davisTemplates).returning();
    console.log(`✓ Created ${davisTemplateResults.length} templates for Davis & Partners`);
    davisTemplateResults.forEach(t => console.log(`  - ${t.name} (${t.id})`));
    console.log('');

    // Create initial version records for all templates
    console.log('Creating template version history...');
    const allTemplateResults = [...smithTemplateResults, ...johnsonTemplateResults, ...davisTemplateResults];
    const allTemplates = [...smithTemplates, ...johnsonTemplates, ...davisTemplates];

    const versionRecords = allTemplateResults.map((tpl, index) => ({
      templateId: tpl.id,
      versionNumber: 1,
      structure: {
        sections: allTemplates[index].sections,
        variables: allTemplates[index].variables,
      },
      createdBy: tpl.createdBy,
    }));

    await db.insert(templateVersions).values(versionRecords);
    console.log(`✓ Created version 1 records for all ${allTemplateResults.length} templates\n`);

    // Update the sample project to use the new personal injury template
    const smithTemplate = smithTemplateResults[0];

    // Create a sample project
    console.log('Creating sample project...');
    const [sampleProject] = await db.insert(projects).values([
      {
        title: 'Johnson v. ABC Insurance - Auto Accident',
        clientName: 'Robert Johnson',
        status: 'draft',
        caseDetails: {
          incidentDate: '2024-08-15',
          incidentLocation: '123 Main Street, Springfield',
          description: 'Rear-end collision at traffic light',
          totalDamages: 45000,
        },
        templateId: smithTemplate.id,
        firmId: smithFirm.id,
        createdBy: smithUsers[1].id,
      },
    ]).returning();
    console.log(`✓ Created sample project: ${sampleProject.title}\n`);

    // Create a draft for the project
    console.log('Creating draft for sample project...');
    await db.insert(drafts).values([
      {
        projectId: sampleProject.id,
        content: null,
        plainText: 'Draft content will be generated here...',
        currentVersion: 1,
      },
    ]);
    console.log(`✓ Created draft for project\n`);

    console.log('✅ Seed completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Summary:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Firms created: 3`);
    console.log(`Users created: ${smithUsers.length + johnsonUsers.length + davisUsers.length}`);
    console.log(`System templates created: ${allTemplateResults.length} (3 per firm)`);
    console.log(`  - Personal Injury Demand Letter`);
    console.log(`  - Contract Dispute Demand Letter`);
    console.log(`  - Property Damage Demand Letter`);
    console.log(`Template versions created: ${allTemplateResults.length}`);
    console.log(`Projects created: 1`);
    console.log('');
    console.log('🔐 Test Credentials (password: password123):');
    console.log('─────────────────────────────────────────────────────');
    console.log('Smith & Associates:');
    smithUsers.forEach(u => {
      console.log(`  ${u.role.padEnd(10)} - ${u.email.padEnd(30)} (${u.firstName} ${u.lastName})`);
    });
    console.log('');
    console.log('Johnson Legal Group:');
    johnsonUsers.forEach(u => {
      console.log(`  ${u.role.padEnd(10)} - ${u.email.padEnd(30)} (${u.firstName} ${u.lastName})`);
    });
    console.log('');
    console.log('Davis & Partners:');
    davisUsers.forEach(u => {
      console.log(`  ${u.role.padEnd(10)} - ${u.email.padEnd(30)} (${u.firstName} ${u.lastName})`);
    });
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed
seed();
