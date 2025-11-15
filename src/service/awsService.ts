import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multer, { StorageEngine } from 'multer';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';

import dotenv from 'dotenv';
import stream from 'stream';
import csv from 'csv-parser';
import xlsx from 'xlsx';

dotenv.config();

// Memory storage configuration for Multer
const storage: StorageEngine = multer.memoryStorage();

// Multer instance for handling file uploads
const upload = multer({
    storage,
    limits: {
        fileSize: 30 * 1024 * 1024,  // 10 MB size limit
    },
    fileFilter: (req, file, cb) => {
        // Add CSV and Excel MIME types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'text/csv',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only .jpg, .jpeg, .png, .csv, and .xlsx are allowed.'));
        }
        cb(null, true);
    }
});

// Initialize S3 Client with increased timeout and retry options

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: process.env.AWS_DEFAULT_REGION as string,
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 30000, // 30 seconds
        socketTimeout: 30000,     // 30 seconds
    }),
    maxAttempts: 5,               // Retry max 5 times
    retryMode: 'standard',        // Standard retry mode
    logger: console,              // Log requests and responses
});

// CSV Parsing function
const parseCSV = (buffer: Buffer) => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const readableStream = new stream.Readable();
        readableStream.push(buffer);
        readableStream.push(null);  // Signals the end of the stream

        readableStream
            .pipe(csv())
            .on('data', (data: any) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error: any) => reject(error));
    });
};

// Excel Parsing function
const parseExcel = (buffer: Buffer) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

// Function to get a signed URL for an image from S3
const s3GetAllImage = async (photo: string): Promise<string> => {
    const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: photo,
    };

    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
};

// Function to delete an image from S3
const s3DelImage = async (fileUrl: string): Promise<void> => {
    try {
        // Extract the S3 key from the file URL
        const url = new URL(fileUrl); // Parse the URL
        const bucketKey = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/' and decode

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: bucketKey,
        };

        // Send delete command to S3
        await s3.send(new DeleteObjectCommand(params));
        console.log('Image deleted successfully:', bucketKey);
    } catch (error) {
        console.error('Error deleting image from S3:', error);
        throw error;
    }
};

// Function to upload an image to S3
const s3UploadImage = async (data: Buffer, mimetype: string, photo: string): Promise<void> => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: photo,
        Body: data,
        ContentType: mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        console.log('Image uploaded successfully to S3:', photo);
    } catch (error: any) {
        if (error.$metadata && error.$metadata.httpStatusCode === 400) {
            console.error('Bad Request:', error.message);
        } else if (error.name === 'RequestTimeout') {
            console.error('Request Timeout:', error.message);
        } else {
            console.error('Error uploading image to S3:', error);
        }
        throw error; // Re-throw the error after logging
    }
};




export {
    s3,
    upload,
    s3UploadImage,
    s3GetAllImage,
    s3DelImage,
    parseCSV,
    parseExcel,
};
