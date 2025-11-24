const fs = require('fs')
const path = require('path')

// Read CSV file
const csvPath = path.join(__dirname, '..', 'users_rows.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')

// Parse CSV - handle quoted values
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Parse CSV
const lines = csvContent.trim().split('\n')
const headers = parseCSVLine(lines[0])

// Find column indices
const idIndex = headers.indexOf('id')
const nameIndex = headers.indexOf('name')
const emailIndex = headers.indexOf('email')
const kelasIndex = headers.indexOf('kelas')

// Function to generate password based on name
function generatePassword(fullName) {
  const firstName = fullName.split(' ')[0].toLowerCase()
  const nameHash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const number = (nameHash % 900) + 100
  return `${firstName}${number}`
}

// Filter users with kelas "X RPL 1"
const xRpl1Users = []

for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line.trim()) continue
  
  const values = parseCSVLine(line)
  
  if (values.length > kelasIndex) {
    const kelas = values[kelasIndex]?.trim()
    if (kelas === 'X RPL 1') {
      const name = values[nameIndex]?.trim() || ''
      const email = values[emailIndex]?.trim() || ''
      const password = generatePassword(name)
      xRpl1Users.push({ name, email, password })
    }
  }
}

// Sort by name
xRpl1Users.sort((a, b) => a.name.localeCompare(b.name))

// Generate markdown table
const output = []
output.push('# Tabel Email dan Username - X RPL 1\n')
output.push('## Daftar Lengkap Siswa X RPL 1\n')
output.push('| No | Nama Lengkap | Email | Password |')
output.push('|----|--------------|-------|----------|')

xRpl1Users.forEach((user, index) => {
  output.push(`| ${index + 1} | ${user.name} | ${user.email} | ${user.password} |`)
})

output.push(`\n**Total: ${xRpl1Users.length} siswa**\n`)
output.push('\n## Format Text\n')
output.push('Email dan Username X RPL 1:\n')

xRpl1Users.forEach((user, index) => {
  output.push(`${index + 1}. ${user.name}`)
  output.push(`   Email: ${user.email}`)
  output.push(`   Password: ${user.password}\n`)
})

// Write to file
const outputPath = path.join(__dirname, '..', 'TABEL-USER-X-RPL-1.md')
fs.writeFileSync(outputPath, output.join('\n'), 'utf-8')

// Also print to console
console.log(output.join('\n'))



