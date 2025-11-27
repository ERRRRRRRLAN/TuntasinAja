/**
 * Script untuk update Android launcher icons dari logo SVG
 * 
 * Requirements:
 * - sharp: npm install sharp (atau npm install --save-dev sharp)
 * - logo.svg harus ada di public/logo.svg
 * 
 * Usage:
 * node scripts/update-android-icons-from-svg.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ukuran Android mipmap untuk setiap density
const mipmapSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
};

const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const logoSvg = path.join(__dirname, '..', 'public', 'logo.svg');

async function updateAndroidIcons() {
    console.log('🎨 Update Android Launcher Icons dengan Logo TuntasinAja...\n');

    // Check if logo.svg exists
    if (!fs.existsSync(logoSvg)) {
        console.error('❌ logo.svg tidak ditemukan di public/logo.svg');
        console.log('💡 Pastikan file logo.svg ada di folder public/');
        process.exit(1);
    }

    console.log('✅ Logo SVG ditemukan: public/logo.svg\n');

    try {
        // Update icon untuk setiap density
        for (const [mipmapDir, size] of Object.entries(mipmapSizes)) {
            const targetDir = path.join(androidResDir, mipmapDir);
            
            if (!fs.existsSync(targetDir)) {
                console.log(`⚠️  Folder tidak ditemukan: ${mipmapDir}, skip...`);
                continue;
            }

            console.log(`📦 Processing ${mipmapDir} (${size}x${size})...`);

            // Generate icon dari SVG
            const iconPath = path.join(targetDir, 'ic_launcher_foreground.png');
            const iconRoundPath = path.join(targetDir, 'ic_launcher_round.png');
            const iconFullPath = path.join(targetDir, 'ic_launcher.png');

            // Generate foreground icon (untuk adaptive icon)
            await sharp(logoSvg)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                })
                .png()
                .toFile(iconPath);

            // Generate full icon (square dengan background)
            await sharp(logoSvg)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366f1 (theme color)
                })
                .png()
                .toFile(iconFullPath);

            // Generate round icon
            await sharp(logoSvg)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366f1
                })
                .png()
                .toFile(iconRoundPath);

            console.log(`  ✅ Updated: ${mipmapDir}`);
        }

        // Update background color untuk adaptive icon
        console.log('\n🎨 Update background color untuk adaptive icon...');
        const backgroundColorFile = path.join(androidResDir, 'values', 'ic_launcher_background.xml');
        
        if (fs.existsSync(backgroundColorFile)) {
            const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#6366f1</color>
</resources>`;
            fs.writeFileSync(backgroundColorFile, backgroundXml);
            console.log('  ✅ Background color updated');
        }

        console.log('\n✨ Semua icon Android berhasil diupdate!');
        console.log('📱 Build APK untuk melihat perubahan:');
        console.log('   .\\build-android-d-drive.ps1\n');

    } catch (error) {
        console.error('❌ Error updating icons:', error.message);
        console.log('\n💡 Pastikan sharp sudah diinstall: npm install sharp');
        process.exit(1);
    }
}

updateAndroidIcons();

