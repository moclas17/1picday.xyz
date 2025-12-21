import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function getPresignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string
) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        // Disable automated checksums which can interfere with browser fetch
        ChecksumAlgorithm: undefined,
    });

    // Expires in 60 seconds
    return getSignedUrl(s3Client, command, { expiresIn: 60 });
}

export async function getSignedReadUrl(bucket: string, key: string) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    // Valid for 24 hours
    return getSignedUrl(s3Client, command, { expiresIn: 86400 });
}

export { s3Client };
