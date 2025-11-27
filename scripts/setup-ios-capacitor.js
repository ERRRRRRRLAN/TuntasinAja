/**
 * Script untuk setup iOS platform dengan Capacitor
 * 
 * Usage:
 * node scripts/setup-ios-capacitor.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍎 Setup iOS Platform dengan Capacitor...\n');

// Check if @capacitor/ios is installed
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasIos = packageJson.dependencies?.['@capacitor/ios'] || packageJson.devDependencies?.['@capacitor/ios'];

if (!hasIos) {
  console.log('📦 Installing @capacitor/ios...');
  execSync('npm install @capacitor/ios', { stdio: 'inherit' });
  console.log('✅ @capacitor/ios installed\n');
}

// Check if ios folder exists
const iosPath = path.join(process.cwd(), 'ios');
if (!fs.existsSync(iosPath)) {
  console.log('📱 Adding iOS platform...');
  try {
    execSync('npx cap add ios --no-deps', { stdio: 'inherit' });
    console.log('✅ iOS platform added\n');
  } catch (error) {
    console.error('❌ Error adding iOS platform:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ iOS platform already exists\n');
}

// Update capacitor.config.ts to include iOS config
console.log('⚙️  Updating capacitor.config.ts...');
const configPath = path.join(process.cwd(), 'capacitor.config.ts');
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check if iOS config already exists
  if (!configContent.includes('ios:')) {
    // Add iOS config before closing brace
    configContent = configContent.replace(
      /(\s+android:\s+{[^}]+}\s*)(})/,
      `$1  ios: {\n    contentInset: 'automatic',\n    scrollEnabled: true,\n  },\n$2`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ capacitor.config.ts updated with iOS config\n');
  } else {
    console.log('✅ iOS config already exists in capacitor.config.ts\n');
  }
}

console.log('✨ Setup iOS platform completed!\n');
console.log('📝 Next steps:');
console.log('  1. npm run build');
console.log('  2. npx cap sync ios');
console.log('  3. npx cap open ios (to open in Xcode)');
console.log('');

