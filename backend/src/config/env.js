const required = [
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'AUTH_API_URL',
  'AUTH_API_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const config = {
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET,
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  auth: {
    apiUrl: process.env.AUTH_API_URL,
    apiKey: process.env.AUTH_API_KEY,
  },
};
