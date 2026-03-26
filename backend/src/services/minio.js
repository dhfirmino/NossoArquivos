import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config/env.js';

const protocol = config.minio.useSSL ? 'https' : 'http';

const s3 = new S3Client({
  endpoint: `${protocol}://${config.minio.endpoint}:${config.minio.port}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

const bucket = config.minio.bucket;

export async function listObjects(prefix = '') {
  const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
    Delimiter: '/',
  });
  const response = await s3.send(command);

  const folders = (response.CommonPrefixes || []).map((p) => ({
    name: p.Prefix.replace(normalizedPrefix, '').replace(/\/$/, ''),
    path: p.Prefix.replace(/\/$/, ''),
    type: 'folder',
  }));

  const files = (response.Contents || [])
    .filter((obj) => obj.Key !== normalizedPrefix)
    .map((obj) => ({
      name: obj.Key.replace(normalizedPrefix, ''),
      path: obj.Key,
      type: 'file',
      size: obj.Size,
      lastModified: obj.LastModified,
    }));

  return { folders, files };
}

export async function createFolder(path) {
  const key = path.endsWith('/') ? path : path + '/';
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: '',
  });
  await s3.send(command);
}

export async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3.send(command);
}

export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3.send(command);
}

export async function deleteFolder(prefix) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/';
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
  });
  const response = await s3.send(listCommand);
  const objects = response.Contents || [];

  if (objects.length === 0) return;

  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: objects.map((obj) => ({ Key: obj.Key })),
    },
  });
  await s3.send(deleteCommand);
}

export async function getObject(key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return s3.send(command);
}

export async function getObjectInfo(key) {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
  };
}
