import { db } from './client';
import { firms, users, templates, projects, drafts } from './schema';
import { eq } from 'drizzle-orm';

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n');

  try {
    // Query all firms
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 FIRMS:');
    console.log('═══════════════════════════════════════════════════════');
    const allFirms = await db.select().from(firms);
    allFirms.forEach((firm, index) => {
      console.log(`\n${index + 1}. ${firm.name}`);
      console.log(`   ID: ${firm.id}`);
      console.log(`   Created: ${firm.createdAt.toISOString()}`);
    });

    // Query all users with their firm info
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('👥 USERS (with Firm Information):');
    console.log('═══════════════════════════════════════════════════════');

    for (const firm of allFirms) {
      console.log(`\n${firm.name}:`);
      console.log('─────────────────────────────────────────────────────');

      const firmUsers = await db
        .select()
        .from(users)
        .where(eq(users.firmId, firm.id));

      firmUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     User ID: ${user.id}`);
      });
    }

    // Query templates
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📝 TEMPLATES:');
    console.log('═══════════════════════════════════════════════════════');
    const allTemplates = await db.select().from(templates);
    allTemplates.forEach((template, index) => {
      console.log(`\n${index + 1}. ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Version: ${template.version}`);
      console.log(`   Sections: ${(template.sections as any[]).length}`);
      console.log(`   Variables: ${(template.variables as any[]).length}`);
    });

    // Query projects
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('💼 PROJECTS:');
    console.log('═══════════════════════════════════════════════════════');
    const allProjects = await db.select().from(projects);
    allProjects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.title}`);
      console.log(`   Client: ${project.clientName}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Project ID: ${project.id}`);
    });

    // Query drafts
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📄 DRAFTS:');
    console.log('═══════════════════════════════════════════════════════');
    const allDrafts = await db.select().from(drafts);
    allDrafts.forEach((draft, index) => {
      console.log(`\n${index + 1}. Draft ID: ${draft.id}`);
      console.log(`   Project ID: ${draft.projectId}`);
      console.log(`   Version: ${draft.currentVersion}`);
      console.log(`   Plain Text Preview: ${draft.plainText?.substring(0, 50)}...`);
    });

    // Summary statistics
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY STATISTICS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Firms: ${allFirms.length}`);
    console.log(`Total Users: ${(await db.select().from(users)).length}`);
    console.log(`Total Templates: ${allTemplates.length}`);
    console.log(`Total Projects: ${allProjects.length}`);
    console.log(`Total Drafts: ${allDrafts.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Verification complete! All data retrieved successfully.\n');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run verification
verifyData();
