const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class TwoFactorAuthSystem {
  // Generate 2FA Secret
  static generateSecret(userEmail, companyName = 'ESG Platform') {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: companyName,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: null // Will be generated separately
    };
  }

  // Generate QR Code
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Enable 2FA for User
  static async enable2FA(userId, secret) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?`,
        [secret, userId], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
    });
  }

  // Disable 2FA for User
  static async disable2FA(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?`,
        [userId], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
    });
  }

  // Verify 2FA Token
  static async verifyToken(userId, token) {
    const user = await this.getUserSecret(userId);
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      return { valid: false, error: '2FA not enabled for user' };
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (verified) {
      await this.logSuccessfulVerification(userId);
    } else {
      await this.logFailedVerification(userId);
    }

    return { valid: verified };
  }

  // Setup 2FA Process
  static async setup2FA(userId, userEmail) {
    try {
      // Generate secret
      const secretData = this.generateSecret(userEmail);
      
      // Generate QR code
      const qrCode = await this.generateQRCode(secretData.otpauthUrl);
      
      // Store temporary secret (not enabled yet)
      await this.storeTempSecret(userId, secretData.secret);
      
      return {
        secret: secretData.secret,
        qrCode: qrCode,
        manualEntryKey: secretData.secret,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      throw new Error('Failed to setup 2FA: ' + error.message);
    }
  }

  // Confirm 2FA Setup
  static async confirm2FASetup(userId, token) {
    const tempSecret = await this.getTempSecret(userId);
    if (!tempSecret) {
      return { success: false, error: 'No pending 2FA setup found' };
    }

    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      await this.enable2FA(userId, tempSecret);
      await this.clearTempSecret(userId);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid verification code' };
    }
  }

  // Generate Backup Codes
  static generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Store Backup Codes
  static async storeBackupCodes(userId, codes) {
    const db = await getDb();
    const hashedCodes = codes.map(code => ({
      user_id: userId,
      code_hash: this.hashBackupCode(code),
      used: false
    }));

    return new Promise((resolve, reject) => {
      const placeholders = hashedCodes.map(() => '(?, ?, ?)').join(',');
      const values = hashedCodes.flatMap(code => [code.user_id, code.code_hash, code.used]);
      
      db.run(`INSERT INTO backup_codes (user_id, code_hash, used) VALUES ${placeholders}`,
        values, function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
    });
  }

  // Verify Backup Code
  static async verifyBackupCode(userId, code) {
    const db = await getDb();
    const hashedCode = this.hashBackupCode(code);
    
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM backup_codes WHERE user_id = ? AND code_hash = ? AND used = 0`,
        [userId, hashedCode], (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            // Mark code as used
            db.run(`UPDATE backup_codes SET used = 1 WHERE id = ?`, [row.id], (updateErr) => {
              if (updateErr) reject(updateErr);
              else resolve({ valid: true });
            });
          } else {
            resolve({ valid: false });
          }
        });
    });
  }

  // Get User's 2FA Status
  static async get2FAStatus(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.get(`SELECT two_factor_enabled, 
        (SELECT COUNT(*) FROM backup_codes WHERE user_id = ? AND used = 0) as unused_backup_codes`,
        [userId, userId], (err, row) => {
          if (err) reject(err);
          else resolve({
            enabled: !!row?.two_factor_enabled,
            backupCodesRemaining: row?.unused_backup_codes || 0
          });
        });
    });
  }

  // Helper Methods
  static async getUserSecret(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?',
        [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });
  }

  static async storeTempSecret(userId, secret) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO temp_2fa_secrets (user_id, secret, created_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [userId, secret], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  static async getTempSecret(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT secret FROM temp_2fa_secrets WHERE user_id = ?',
        [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row?.secret);
        });
    });
  }

  static async clearTempSecret(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM temp_2fa_secrets WHERE user_id = ?',
        [userId], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
    });
  }

  static hashBackupCode(code) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  static async logSuccessfulVerification(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO auth_logs (user_id, action, status, created_at) 
        VALUES (?, '2FA_VERIFY', 'success', CURRENT_TIMESTAMP)`,
        [userId], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  static async logFailedVerification(userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO auth_logs (user_id, action, status, created_at) 
        VALUES (?, '2FA_VERIFY', 'failed', CURRENT_TIMESTAMP)`,
        [userId], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }
}

module.exports = TwoFactorAuthSystem;