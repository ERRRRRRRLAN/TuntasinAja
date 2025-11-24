const fs = require('fs')
const path = require('path')

// Read CSV file
const csvPath = path.join(__dirname, '..', 'users_rows.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')

// Parse CSV
const lines = csvContent.trim().split('\n')
const headers = lines[0].split(',')

// Find column indices
const idIndex = headers.indexOf('id')
const nameIndex = headers.indexOf('name')
const emailIndex = headers.indexOf('email')
const kelasIndex = headers.indexOf('kelas')

// Filter users with kelas "X RPL 1"
const xRpl1Users = []

for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  // Handle CSV parsing (simple split, may need improvement for quoted values)
  const values = line.split(',')
  
  if (values.length > kelasIndex) {
    const kelas = values[kelasIndex]?.trim()
    if (kelas === 'X RPL 1') {
      const name = values[nameIndex]?.trim() || ''
      const email = values[emailIndex]?.trim() || ''
      xRpl1Users.push({ name, email })
    }
  }
}

// Sort by name
xRpl1Users.sort((a, b) => a.name.localeCompare(b.name))

// Generate markdown table
console.log('# Tabel Email dan Username - X RPL 1\n')
console.log('| No | Nama | Email |')
console.log('|----|------|-------|')

xRpl1Users.forEach((user, index) => {
  console.log(`| ${index + 1} | ${user.name} | ${user.email} |`)
})

console.log(`\n**Total: ${xRpl1Users.length} siswa**\n`)

// Also generate a simple text table
console.log('\n## Format Text\n')
console.log('Email dan Username X RPL 1:\n')
xRpl1Users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}`)
  console.log(`   Email: ${user.email}\n`)
})



