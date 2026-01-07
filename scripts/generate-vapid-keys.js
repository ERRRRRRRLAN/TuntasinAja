const webpush = require('web-push')

console.log('Generating VAPID keys for Web Push...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID Keys Generated Successfully!\n')
console.log('Add these to your environment variables:\n')
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret! Do not commit it to git.')
console.log('✅ You can safely commit NEXT_PUBLIC_VAPID_PUBLIC_KEY to git.')

