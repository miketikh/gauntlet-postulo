import { db } from './client';
import { firms, users, templates, projects, drafts, sourceDocuments, comments, draftSnapshots } from './schema';
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

    // Create sample templates
    console.log('Creating sample templates...');
    const [smithTemplate] = await db.insert(templates).values([
      {
        name: 'Standard Personal Injury Demand Letter',
        description: 'Template for personal injury claims including medical expenses and damages',
        sections: [
          { id: '1', title: 'Introduction', order: 1 },
          { id: '2', title: 'Facts of the Incident', order: 2 },
          { id: '3', title: 'Liability', order: 3 },
          { id: '4', title: 'Medical Treatment and Expenses', order: 4 },
          { id: '5', title: 'Damages Summary', order: 5 },
          { id: '6', title: 'Settlement Demand', order: 6 },
        ],
        variables: [
          { name: 'clientName', label: 'Client Name', type: 'text' },
          { name: 'incidentDate', label: 'Incident Date', type: 'date' },
          { name: 'totalDamages', label: 'Total Damages', type: 'currency' },
        ],
        firmId: smithFirm.id,
        createdBy: smithUsers[0].id,
      },
      {
        name: 'Property Damage Demand Letter',
        description: 'Template for property damage claims',
        sections: [
          { id: '1', title: 'Introduction', order: 1 },
          { id: '2', title: 'Description of Property Damage', order: 2 },
          { id: '3', title: 'Liability Analysis', order: 3 },
          { id: '4', title: 'Damages and Repair Costs', order: 4 },
          { id: '5', title: 'Settlement Demand', order: 5 },
        ],
        variables: [
          { name: 'clientName', label: 'Client Name', type: 'text' },
          { name: 'propertyAddress', label: 'Property Address', type: 'text' },
          { name: 'damageAmount', label: 'Damage Amount', type: 'currency' },
        ],
        firmId: smithFirm.id,
        createdBy: smithUsers[1].id,
      },
    ]).returning();
    console.log(`✓ Created ${2} templates for Smith & Associates\n`);

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
    console.log(`Templates created: 2`);
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
