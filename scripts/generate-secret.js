#!/usr/bin/env node

/**
 * Script untuk generate NEXTAUTH_SECRET
 * 
 * Usage:
 *   node scripts/generate-secret.js
 *   atau
 *   npm run generate:secret
 */

const crypto = require('crypto');

// Generate random 32 bytes dan convert ke base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔑 NEXTAUTH_SECRET Generated:\n');
console.log(secret);
console.log('\n📋 Copy secret di atas dan paste ke Vercel Environment Variables');
console.log('   Key: NEXTAUTH_SECRET');
console.log('   Value: (paste secret di atas)\n');

