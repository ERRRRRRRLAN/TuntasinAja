/**
 * Script untuk generate icon PWA dari logo SVG
 * 
 * Requirements:
 * - sharp: npm install sharp
 * - logo.svg harus ada di public/logo.svg
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const logoSvg = path.join(publicDir, 'logo.svg');

async function generateIcons() {
  // Check if logo.svg exists
  if (!fs.existsSync(logoSvg)) {
    console.error('❌ logo.svg tidak ditemukan di public/logo.svg');
    console.log('💡 Buat logo.svg terlebih dahulu atau gunakan logo yang sudah ada');
    process.exit(1);
  }

  console.log('🎨 Generating PWA icons from logo.svg...\n');

  try {
    for (const size of sizes) {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      
      await sharp(logoSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 241, g: 245, b: 249, alpha: 1 } // Background color #f1f5f9
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✨ Semua icon berhasil di-generate!');
    console.log('📱 Icon siap digunakan untuk PWA');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Pastikan sharp sudah diinstall: npm install sharp');
    process.exit(1);
  }
}

generateIcons();

