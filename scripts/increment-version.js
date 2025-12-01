const fs = require('fs')
const path = require('path')

const buildGradlePath = path.join(__dirname, '../android/app/build.gradle')

try {
  let content = fs.readFileSync(buildGradlePath, 'utf8')
  
  let updated = false
  
  // Find versionCode and increment
  const versionCodeMatch = content.match(/versionCode\s+(\d+)/)
  if (versionCodeMatch) {
    const currentCode = parseInt(versionCodeMatch[1])
    const newCode = currentCode + 1
    content = content.replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
    console.log(`✅ Version code updated: ${currentCode} → ${newCode}`)
    updated = true
  } else {
    console.warn('⚠️  versionCode not found in build.gradle')
  }
  
  // Find versionName and increment
  const versionNameMatch = content.match(/versionName\s+"([^"]+)"/)
  if (versionNameMatch) {
    const currentName = versionNameMatch[1]
    const parts = currentName.split('.')
    const major = parseInt(parts[0] || '1')
    const minor = parseInt(parts[1] || '0') + 1
    const newName = `${major}.${minor}`
    content = content.replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`)
    console.log(`✅ Version name updated: ${currentName} → ${newName}`)
    updated = true
  } else {
    console.warn('⚠️  versionName not found in build.gradle')
  }
  
  if (updated) {
    fs.writeFileSync(buildGradlePath, content, 'utf8')
    console.log('✅ build.gradle updated successfully')
  } else {
    console.warn('⚠️  No version fields found to update')
  }
} catch (error) {
  console.error('❌ Error updating version:', error)
  process.exit(1)
}

