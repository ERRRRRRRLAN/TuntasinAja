const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const models = [
  'user',
  'thread',
  'comment',
  'userStatus',
  'history',
  'userPermission',
  'classSubscription',
  'classSchedule',
  'weeklySchedule',
  'classSubject',
  'feedback',
  'deviceToken',
  'webPushSubscription',
  'appSettings',
  'announcement',
  'announcementRead',
  'userSettings',
  'groupMember',
  'school',
  'class',
];

async function exportData() {
  console.log('Starting export...');
  const backupDir = path.join(__dirname, '../backup');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  for (const model of models) {
    try {
      console.log(`Exporting ${model}...`);
      // Access the model dynamically. Note: prisma['class'] works fine.
      const data = await prisma[model].findMany();
      
      const filePath = path.join(backupDir, `${model}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved ${data.length} records to ${filePath}`);
    } catch (error) {
      console.error(`Error exporting ${model}:`, error.message);
    }
  }

  console.log('Export completed.');
  await prisma.$disconnect();
}

exportData().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
