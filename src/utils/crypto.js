const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const secret = process.env.CRYPTO_SECRET_KEY;
  if (!secret) throw new Error('CRYPTO_SECRET_KEY required');
  return crypto.pbkdf2Sync(secret, 'salt', 100000, KEY_LENGTH, 'sha512');
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, tag]);
  
  return combined.toString('base64');
}

function decrypt(encryptedData) {
  const key = getKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.slice(0, IV_LENGTH);
  const tag = combined.slice(-TAG_LENGTH);
  const encrypted = combined.slice(IV_LENGTH, -TAG_LENGTH);
  
  const decipher = crypto.createDecipher(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };