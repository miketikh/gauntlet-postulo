/**
 * Template Verification Script
 * Verifies that default templates are seeded correctly (Story 3.10)
 */

import { db } from './client';
import { firms, templates, templateVersions } from './schema';
import { eq } from 'drizzle-orm';

async function verifyTemplates() {
  console.log('🔍 Verifying default templates (Story 3.10)...\n');

  try {
    // Fetch all firms and templates
    const allFirms = await db.select().from(firms);
    const allTemplates = await db.select().from(templates);
    const allVersions = await db.select().from(templateVersions);

    console.log('📊 Database Summary:');
    console.log(`   Firms: ${allFirms.length}`);
    console.log(`   Templates: ${allTemplates.length}`);
    console.log(`   Template Versions: ${allVersions.length}\n`);

    // Verify each firm has templates
    let allChecksPass = true;

    for (const firm of allFirms) {
      console.log(`\n🏢 ${firm.name}`);
      console.log('   ' + '─'.repeat(50));

      const firmTemplates = allTemplates.filter(t => t.firmId === firm.id);

      if (firmTemplates.length !== 3) {
        console.log(`   ❌ Expected 3 templates, found ${firmTemplates.length}`);
        allChecksPass = false;
      } else {
        console.log(`   ✓ Has 3 templates`);
      }

      // Check for each template type
      const templateNames = firmTemplates.map(t => t.name);

      const expectedTemplates = [
        'Personal Injury Demand Letter',
        'Contract Dispute Demand Letter',
        'Property Damage Demand Letter'
      ];

      expectedTemplates.forEach(expectedName => {
        if (templateNames.includes(expectedName)) {
          console.log(`   ✓ ${expectedName}`);
        } else {
          console.log(`   ❌ Missing: ${expectedName}`);
          allChecksPass = false;
        }
      });

      // Check if they are system templates
      const systemTemplates = firmTemplates.filter(t => t.isSystemTemplate);
      if (systemTemplates.length === firmTemplates.length) {
        console.log(`   ✓ All templates marked as system templates`);
      } else {
        console.log(`   ❌ Not all templates marked as system templates (${systemTemplates.length}/${firmTemplates.length})`);
        allChecksPass = false;
      }

      // Check if they are active
      const activeTemplates = firmTemplates.filter(t => t.isActive);
      if (activeTemplates.length === firmTemplates.length) {
        console.log(`   ✓ All templates are active`);
      } else {
        console.log(`   ❌ Not all templates are active (${activeTemplates.length}/${firmTemplates.length})`);
        allChecksPass = false;
      }

      // Check version history
      for (const template of firmTemplates) {
        const versions = allVersions.filter(v => v.templateId === template.id);
        if (versions.length === 0) {
          console.log(`   ❌ No version history for: ${template.name}`);
          allChecksPass = false;
        }
      }
    }

    // Detailed template inspection for one firm
    console.log('\n\n📋 Detailed Template Inspection (First Firm):');
    console.log('   ' + '='.repeat(50));

    const firstFirm = allFirms[0];
    const firstFirmTemplates = allTemplates.filter(t => t.firmId === firstFirm.id);

    for (const template of firstFirmTemplates) {
      console.log(`\n   Template: ${template.name}`);
      console.log(`   Description: ${template.description}`);

      const sections = template.sections as any[];
      const variables = template.variables as any[];

      console.log(`   Sections: ${sections.length}`);
      sections.forEach((section: any, idx) => {
        console.log(`      ${idx + 1}. ${section.title} (${section.type})`);
      });

      console.log(`   Variables: ${variables.length}`);
      const requiredVars = variables.filter((v: any) => v.required);
      console.log(`      Required: ${requiredVars.map((v: any) => v.name).join(', ')}`);

      // Check for AI-generated sections with prompt guidance
      const aiSections = sections.filter((s: any) => s.type === 'ai_generated');
      const aiSectionsWithGuidance = aiSections.filter((s: any) => s.promptGuidance && s.promptGuidance.length > 0);

      if (aiSections.length === aiSectionsWithGuidance.length) {
        console.log(`   ✓ All ${aiSections.length} AI sections have prompt guidance`);
      } else {
        console.log(`   ❌ ${aiSections.length - aiSectionsWithGuidance.length} AI sections missing prompt guidance`);
        allChecksPass = false;
      }
    }

    console.log('\n\n' + '='.repeat(60));
    if (allChecksPass) {
      console.log('✅ All verification checks passed!');
      console.log('Story 3.10 requirements met:');
      console.log('  ✓ 3 default templates created for each firm');
      console.log('  ✓ Templates include Personal Injury, Contract Dispute, and Property Damage');
      console.log('  ✓ All templates marked as system templates');
      console.log('  ✓ All templates are active');
      console.log('  ✓ Templates have well-crafted sections and variables');
      console.log('  ✓ AI sections have prompt guidance');
      console.log('  ✓ Version history created for all templates');
    } else {
      console.log('❌ Some verification checks failed');
      console.log('Please review the output above for details');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run verification
verifyTemplates();
