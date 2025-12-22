import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

/**
 * Bulk Upload Script for 1picday
 * Usage: node --env-file=.env scripts/bulk-upload.mjs <folder_path> <user_id>
 */

const folderPath = process.argv[2];
const userId = process.argv[3];

if (!folderPath || !userId) {
    console.error("Usage: node --env-file=.env scripts/bulk-upload.mjs <folder_path> <user_id>");
    process.exit(1);
}

// Initialize Clients (Assumes env variables are loaded)
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for bypass RLS if needed
);

async function run() {
    try {
        const files = fs.readdirSync(folderPath)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
            .sort(); // Sort to have a consistent order

        console.log(`Found ${files.length} images to upload for user ${userId}`);

        const today = new Date();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path.join(folderPath, file);
            
            // Calculate date: Today - i days
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);
            const dateStr = targetDate.toISOString().split('T')[0];
            const yearStr = targetDate.getFullYear().toString();
            
            const ext = path.extname(file).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            const s3Key = `users/${userId}/${yearStr}/${dateStr}${ext}`;
            const bucket = process.env.AWS_S3_BUCKET;

            console.log(`[${i+1}/${files.length}] Processing ${file} as ${dateStr}...`);

            // 1. Upload to S3
            const fileBuffer = fs.readFileSync(filePath);
            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: mimeType
            }));
            console.log(`   - Uploaded to S3: ${s3Key}`);

            // 2. Commit to DB
            const { error } = await supabase.from("daily_photos").upsert({
                user_id: userId,
                date: dateStr,
                s3_key: s3Key,
                s3_bucket: bucket,
                mime_type: mimeType,
            }, { onConflict: 'user_id,date' });

            if (error) {
                console.error(`   - Database error: ${error.message}`);
            } else {
                console.log(`   - Committed to database.`);
            }
        }

        console.log("\n✅ Bulk upload completed successfully!");
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

run();
