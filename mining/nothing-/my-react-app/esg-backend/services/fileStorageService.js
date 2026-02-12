import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class FileStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/evidence');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }
  }

  // Upload file to local storage (can be extended to S3)
  async uploadFile(dataId, file, uploadedBy, description = '') {
    // Validate file name to prevent path traversal
    const sanitizedFileName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileBuffer = Buffer.from(file.data, 'base64');
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    const filePath = path.resolve(this.uploadDir, fileName);
    
    // Ensure file path is within upload directory
    if (!filePath.startsWith(path.resolve(this.uploadDir))) {
      throw new Error('Invalid file path');
    }
    
    await fs.writeFile(filePath, fileBuffer);
    
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO evidence_files (data_id, file_name, file_type, file_size, 
          file_path, description, uploaded_by, checksum)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dataId,
        sanitizedFileName,
        file.type,
        file.size,
        filePath,
        description,
        uploadedBy,
        checksum
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, fileName: sanitizedFileName, checksum });
      });
    });
  }

  // Upload to S3 (AWS SDK integration)
  async uploadToS3(dataId, file) {
    // Placeholder for S3 integration
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3();
    // const params = {
    //   Bucket: process.env.S3_BUCKET,
    //   Key: `evidence/${dataId}/${Date.now()}_${file.name}`,
    //   Body: Buffer.from(file.data, 'base64'),
    //   ContentType: file.type
    // };
    // const result = await s3.upload(params).promise();
    
    return { s3Key: `evidence/${dataId}/${file.name}`, location: 'S3_URL' };
  }

  async getFile(fileId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM evidence_files WHERE id = ? AND is_deleted = 0', [fileId], 
        async (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('File not found'));
          
          try {
            const fileData = await fs.readFile(row.file_path);
            resolve({ ...row, data: fileData.toString('base64') });
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  async getFilesByDataId(dataId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM evidence_files WHERE data_id = ? AND is_deleted = 0', 
        [dataId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
    });
  }

  async deleteFile(fileId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run('UPDATE evidence_files SET is_deleted = 1 WHERE id = ?', [fileId], 
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes > 0 });
        });
    });
  }
}

export default new FileStorageService();
