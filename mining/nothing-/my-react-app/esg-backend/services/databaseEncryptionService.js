import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.keyPath = path.join(__dirname, '../keys');
    this.ensureKeyDirectory();
  }

  ensureKeyDirectory() {
    if (!fs.existsSync(this.keyPath)) {
      fs.mkdirSync(this.keyPath, { recursive: true, mode: 0o700 });
    }
  }

  // Generate encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Store encryption key securely
  storeKey(keyId, key) {
    const keyFile = path.join(this.keyPath, `${keyId}.key`);
    const keyData = {
      id: keyId,
      key: key.toString('base64'),
      created: new Date().toISOString(),
      algorithm: this.algorithm
    };
    
    fs.writeFileSync(keyFile, JSON.stringify(keyData), { mode: 0o600 });
    return keyId;
  }

  // Load encryption key
  loadKey(keyId) {
    // Validate keyId to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(keyId)) {
      throw new Error('Invalid key ID format');
    }
    
    // Check environment variable first
    const envKey = process.env[`ENCRYPTION_KEY_${keyId.toUpperCase()}`] || process.env.ENCRYPTION_KEY;
    if (envKey) {
      return Buffer.from(envKey, 'base64');
    }
    
    const keyFile = path.join(this.keyPath, `${keyId}.key`);
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Encryption key ${keyId} not found`);
    }
    
    try {
      const keyDataStr = fs.readFileSync(keyFile, 'utf8');
      const keyData = this.safeJSONParse(keyDataStr);
      if (!keyData || !keyData.key) {
        throw new Error('Invalid key file format');
      }
      return Buffer.from(keyData.key, 'base64');
    } catch (error) {
      throw new Error('Failed to load encryption key');
    }
  }

  // Encrypt sensitive data
  // amazonq-ignore-next-line
  encrypt(data, keyId = 'default') {
    if (!data) return null;
    
    try {
      const key = this.loadKey(keyId);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      
      let encrypted = cipher.update(data.toString(), 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        keyId: keyId
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'object') return null;
    
    // Validate required properties
    if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag || !encryptedData.keyId) {
      throw new Error('Invalid encrypted data format');
    }
    
    try {
      const key = this.loadKey(encryptedData.keyId);
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      
      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Hash sensitive data (one-way)
  hash(data, salt = null) {
    if (!data) return null;
    
    const actualSalt = salt || crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(data.toString(), actualSalt, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('base64'),
      salt: actualSalt.toString('base64')
    };
  }

  // Verify hashed data
  verifyHash(data, storedHash) {
    if (!data || !storedHash) return false;
    
    try {
      const salt = Buffer.from(storedHash.salt, 'base64');
      const hash = crypto.pbkdf2Sync(data.toString(), salt, 100000, 64, 'sha512');
      return hash.toString('base64') === storedHash.hash;
    } catch (error) {
      return false;
    }
  }

  // Initialize default encryption key
  initializeDefaultKey() {
    const keyId = 'default';
    
    // Check if key exists in environment variable
    const envKey = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY_DEFAULT;
    if (envKey) {
      console.log('Using encryption key from environment variable');
      return keyId;
    }
    
    const keyFile = path.join(this.keyPath, `${keyId}.key`);
    
    if (!fs.existsSync(keyFile)) {
      const key = this.generateKey();
      this.storeKey(keyId, key);
      console.log('Default encryption key generated and stored securely');
      console.log('IMPORTANT: Set ENCRYPTION_KEY environment variable for production!');
      console.log('WARNING: Using generated key. For production, use environment variables.');
    }
    
    return keyId;
  }

  // Safe JSON parsing to prevent deserialization attacks
  safeJSONParse(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      // Validate that it's a plain object with expected structure
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Invalid JSON structure');
      }
      return parsed;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  // Rotate encryption key
  rotateKey(oldKeyId, newKeyId = null) {
    const actualNewKeyId = newKeyId || `${oldKeyId}_${Date.now()}`;
    const newKey = this.generateKey();
    
    this.storeKey(actualNewKeyId, newKey);
    
    // Archive old key
    const oldKeyFile = path.join(this.keyPath, `${oldKeyId}.key`);
    const archivedKeyFile = path.join(this.keyPath, `${oldKeyId}_archived_${Date.now()}.key`);
    
    if (fs.existsSync(oldKeyFile)) {
      fs.renameSync(oldKeyFile, archivedKeyFile);
    }
    
    return actualNewKeyId;
  }

  // Get encryption status for compliance
  getEncryptionStatus() {
    const keyFiles = fs.readdirSync(this.keyPath).filter(f => f.endsWith('.key'));
    const keys = keyFiles.map(f => {
      try {
        const keyDataStr = fs.readFileSync(path.join(this.keyPath, f), 'utf8');
        const keyData = this.safeJSONParse(keyDataStr);
        return {
          id: keyData.id,
          created: keyData.created,
          algorithm: keyData.algorithm,
          archived: f.includes('_archived_')
        };
      } catch (error) {
        console.warn(`Failed to read key file ${f}:`, error.message);
        return null;
      }
    }).filter(Boolean);
    
    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => !k.archived).length,
      archivedKeys: keys.filter(k => k.archived).length,
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      keys: keys
    };
  }
}

// Middleware for automatic field encryption
class FieldEncryptionMiddleware {
  constructor(encryptionService) {
    this.encryption = encryptionService;
    this.encryptedFields = [
      'password_hash',
      'two_factor_secret', 
      'auth_credentials',
      'api_key',
      'personal_data',
      'sensitive_data'
    ];
  }

  // Encrypt fields before database insert
  encryptFields(data) {
    const encrypted = { ...data };
    
    for (const field of this.encryptedFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = JSON.stringify(this.encryption.encrypt(encrypted[field]));
      }
    }
    
    return encrypted;
  }

  // Decrypt fields after database select
  decryptFields(data) {
    if (!data) return data;
    
    const decrypted = { ...data };
    
    for (const field of this.encryptedFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          const encryptedData = this.encryption.safeJSONParse(decrypted[field]);
          decrypted[field] = this.encryption.decrypt(encryptedData);
        } catch (error) {
          // Field might not be encrypted (legacy data)
          console.warn(`Failed to decrypt field ${field}:`, error.message);
        }
      }
    }
    
    return decrypted;
  }
}

// Initialize encryption service
const encryptionService = new DatabaseEncryptionService();
encryptionService.initializeDefaultKey();

const fieldEncryption = new FieldEncryptionMiddleware(encryptionService);

export {
  DatabaseEncryptionService,
  FieldEncryptionMiddleware,
  encryptionService,
  fieldEncryption
};

export default encryptionService;