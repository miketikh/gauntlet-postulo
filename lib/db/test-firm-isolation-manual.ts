/**
 * Manual Test Script for Firm Isolation
 * Tests the actual API endpoints with real HTTP requests
 *
 * Run this after starting the dev server: npm run dev
 * Then run: tsx lib/db/test-firm-isolation-manual.ts
 */

import { generateAccessToken } from '../services/auth.service';
import { db } from './client';
import { firms, users, projects, templates } from './schema';
import { eq } from 'drizzle-orm';

const API_BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  success: boolean;
  details?: string;
  error?: string;
}

async function makeRequest(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function runTests() {
  console.log('🧪 Manual Firm Isolation Test Suite\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const results: TestResult[] = [];

  try {
    // Get test data from database
    console.log('📊 Fetching test data from database...\n');

    const smithFirm = await db.query.firms.findFirst({
      where: (firms, { ilike }) => ilike(firms.name, '%Smith%')
    });

    const johnsonFirm = await db.query.firms.findFirst({
      where: (firms, { ilike }) => ilike(firms.name, '%Johnson%')
    });

    if (!smithFirm || !johnsonFirm) {
      console.error('❌ Test firms not found. Run: pnpm db:seed');
      process.exit(1);
    }

    const smithUser = await db.query.users.findFirst({
      where: eq(users.firmId, smithFirm.id)
    });

    const johnsonUser = await db.query.users.findFirst({
      where: eq(users.firmId, johnsonFirm.id)
    });

    if (!smithUser || !johnsonUser) {
      console.error('❌ Test users not found. Run: pnpm db:seed');
      process.exit(1);
    }

    // Get a project from Smith firm
    const smithProject = await db.query.projects.findFirst({
      where: eq(projects.firmId, smithFirm.id)
    });

    if (!smithProject) {
      console.error('❌ No projects found for Smith firm. Run: pnpm db:seed');
      process.exit(1);
    }

    console.log('✅ Test data loaded:');
    console.log(`   - Smith Firm: ${smithFirm.name} (${smithFirm.id})`);
    console.log(`   - Johnson Firm: ${johnsonFirm.name} (${johnsonFirm.id})`);
    console.log(`   - Smith User: ${smithUser.email}`);
    console.log(`   - Johnson User: ${johnsonUser.email}`);
    console.log(`   - Smith Project: ${smithProject.title} (${smithProject.id})\n`);

    // Generate JWT tokens for both users
    const smithToken = generateAccessToken({
      userId: smithUser.id,
      email: smithUser.email,
      role: smithUser.role,
      firmId: smithUser.firmId,
    });

    const johnsonToken = generateAccessToken({
      userId: johnsonUser.id,
      email: johnsonUser.email,
      role: johnsonUser.role,
      firmId: johnsonUser.firmId,
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 Running API Tests\n');

    // Test 1: Smith user can list their own projects
    console.log('Test 1: Smith user lists projects...');
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/projects`, smithToken);
      const data = await response.json();

      if (response.status === 200 && data.projects) {
        const allFromSmithFirm = data.projects.every((p: any) => p.firmId === smithFirm.id);
        results.push({
          test: 'Smith user can list own firm projects',
          success: allFromSmithFirm,
          details: `Found ${data.projects.length} projects, all from Smith firm: ${allFromSmithFirm}`
        });
        console.log(`   ✅ SUCCESS - Found ${data.projects.length} projects (all from Smith firm)\n`);
      } else {
        results.push({
          test: 'Smith user can list own firm projects',
          success: false,
          error: `Unexpected response: ${response.status}`
        });
        console.log(`   ❌ FAILED - Status: ${response.status}\n`);
      }
    } catch (error) {
      results.push({
        test: 'Smith user can list own firm projects',
        success: false,
        error: String(error)
      });
      console.log(`   ❌ FAILED - ${error}\n`);
    }

    // Test 2: Johnson user cannot see Smith projects
    console.log('Test 2: Johnson user lists projects...');
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/projects`, johnsonToken);
      const data = await response.json();

      if (response.status === 200 && data.projects) {
        const noSmithProjects = !data.projects.some((p: any) => p.firmId === smithFirm.id);
        results.push({
          test: 'Johnson user cannot see Smith projects',
          success: noSmithProjects,
          details: `Found ${data.projects.length} projects, none from Smith firm: ${noSmithProjects}`
        });
        console.log(`   ✅ SUCCESS - Found ${data.projects.length} projects (none from Smith firm)\n`);
      } else {
        results.push({
          test: 'Johnson user cannot see Smith projects',
          success: false,
          error: `Unexpected response: ${response.status}`
        });
        console.log(`   ❌ FAILED - Status: ${response.status}\n`);
      }
    } catch (error) {
      results.push({
        test: 'Johnson user cannot see Smith projects',
        success: false,
        error: String(error)
      });
      console.log(`   ❌ FAILED - ${error}\n`);
    }

    // Test 3: Smith user can access their own project
    console.log(`Test 3: Smith user accesses project ${smithProject.id}...`);
    try {
      const response = await makeRequest(
        `${API_BASE_URL}/api/projects/${smithProject.id}`,
        smithToken
      );
      const data = await response.json();

      if (response.status === 200 && data.project) {
        results.push({
          test: 'Smith user can access own project',
          success: true,
          details: `Project: ${data.project.title}`
        });
        console.log(`   ✅ SUCCESS - Retrieved: ${data.project.title}\n`);
      } else {
        results.push({
          test: 'Smith user can access own project',
          success: false,
          error: `Unexpected response: ${response.status}`
        });
        console.log(`   ❌ FAILED - Status: ${response.status}\n`);
      }
    } catch (error) {
      results.push({
        test: 'Smith user can access own project',
        success: false,
        error: String(error)
      });
      console.log(`   ❌ FAILED - ${error}\n`);
    }

    // Test 4: Johnson user gets 404 when accessing Smith's project (CRITICAL SECURITY TEST)
    console.log(`Test 4: Johnson user tries to access Smith project ${smithProject.id}...`);
    try {
      const response = await makeRequest(
        `${API_BASE_URL}/api/projects/${smithProject.id}`,
        johnsonToken
      );
      const data = await response.json();

      if (response.status === 404 && data.error?.code === 'NOT_FOUND') {
        results.push({
          test: 'Cross-firm access returns 404 (not 403)',
          success: true,
          details: 'Correctly returned 404 NOT_FOUND'
        });
        console.log(`   ✅ SUCCESS - Correctly returned 404 NOT_FOUND (security requirement)\n`);
      } else if (response.status === 403) {
        results.push({
          test: 'Cross-firm access returns 404 (not 403)',
          success: false,
          error: 'SECURITY ISSUE: Returned 403 instead of 404 (information disclosure)'
        });
        console.log(`   ❌ FAILED - SECURITY ISSUE: Returned 403 instead of 404\n`);
      } else {
        results.push({
          test: 'Cross-firm access returns 404 (not 403)',
          success: false,
          error: `Unexpected response: ${response.status}`
        });
        console.log(`   ❌ FAILED - Status: ${response.status}\n`);
      }
    } catch (error) {
      results.push({
        test: 'Cross-firm access returns 404 (not 403)',
        success: false,
        error: String(error)
      });
      console.log(`   ❌ FAILED - ${error}\n`);
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Test Results Summary\n');

    const passed = results.filter(r => r.success).length;
    const total = results.length;

    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${result.test}`);
      if (result.details) {
        console.log(`      ${result.details}`);
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`\n${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Firm isolation is working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if dev server is running at http://localhost:3000...\n');
fetch('http://localhost:3000/api/health')
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start it first:');
    console.error('   npm run dev\n');
    console.error('Then run this test script in another terminal.');
    process.exit(1);
  });
