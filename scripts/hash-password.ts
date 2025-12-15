/**
 * MD5 Password Hasher for Siagh Finance System
 * 
 * Siagh requires MD5 hashed passwords for authentication
 * Usage: npx ts-node scripts/hash-password.ts your-password
 */

import * as crypto from 'crypto';
import * as readline from 'readline';

function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex').toUpperCase();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Password provided as argument
    const password = args.join(' ');
    const hashed = hashPassword(password);
    console.log('\n🔐 MD5 Hashed Password:');
    console.log(hashed);
    console.log('\n📝 Add this to your .env file:');
    console.log(`FINANCE_PASSWORD="${hashed}"`);
    console.log('');
    return;
  }

  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter your Siagh password: ', (password) => {
    const hashed = hashPassword(password);
    console.log('\n🔐 MD5 Hashed Password:');
    console.log(hashed);
    console.log('\n📝 Add this to your .env file:');
    console.log(`FINANCE_PASSWORD="${hashed}"`);
    console.log('');
    rl.close();
  });
}

main();

