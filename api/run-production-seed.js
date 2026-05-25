const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.production manually
const envPath = path.join(__dirname, '.env.production');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production NOT FOUND!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
    // Basic dotenv-like parsing
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = (match[2] || '').trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        envVars[key] = value;
    }
});

// also set DIRECT_URL from DATABASE_URL if missing
if (envVars.DATABASE_URL && !envVars.DIRECT_URL) {
    envVars.DIRECT_URL = envVars.DATABASE_URL.replace(':6543', ':5432');
}

// Override environment variables for this process
const env = { ...process.env, ...envVars };

console.log('🚀 Running Production Seed with following configuration:');
console.log('📧 ADMIN_EMAIL:', envVars.ADMIN_EMAIL);
console.log('🔑 ADMIN_PASSWORD length:', envVars.ADMIN_PASSWORD ? envVars.ADMIN_PASSWORD.length : 'N/A');
console.log('🔑 ADMIN_PASSWORD value (first 3):', envVars.ADMIN_PASSWORD ? envVars.ADMIN_PASSWORD.substring(0, 3) : 'N/A');
console.log('🔗 DATABASE_HOST:', envVars.DATABASE_URL ? new URL(envVars.DATABASE_URL).host : 'N/A');

// Execute seeding using production-seed.js
try {
    console.log('\n📦 Pushing schema to database...');
    // We'll run npx prisma db push --accept-data-loss
    // Using execSync directly with the environment object
    execSync('npx prisma db push --accept-data-loss', { env, stdio: 'inherit' });

    console.log('\n🌱 Seeding database...');
    execSync('node production-seed.js', { env, stdio: 'inherit' });

    console.log('\n✅ COMPLETED SUCCESSFULLY!');
} catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
}
