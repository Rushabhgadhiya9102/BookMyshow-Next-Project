type EnvKey =
  | 'APINSTANCE'
  | 'CLOUDINARY_API_KEY'
  | 'CLOUDINARY_NAME'
  | 'CLOUDINARY_SECRET_KEY'
  | 'MONGODB_URI'
  | 'SECRET_KEY'
  | 'STRIPE_API_KEY'
  | 'STRIPE_SECRET_KEY';

const readEnv = (key: EnvKey): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const envSetup = {
  get APINSTANCE(): string {
    return readEnv('APINSTANCE');
  },
  get CLOUDINARY_API_KEY(): string {
    return readEnv('CLOUDINARY_API_KEY');
  },
  get CLOUDINARY_NAME(): string {
    return readEnv('CLOUDINARY_NAME');
  },
  get CLOUDINARY_SECRET_KEY(): string {
    return readEnv('CLOUDINARY_SECRET_KEY');
  },
  get Mongo_URL(): string {
    return readEnv('MONGODB_URI');
  },
  get SecretKey(): string {
    return readEnv('SECRET_KEY');
  },
  get STRIPE_API_KEY(): string {
    return readEnv('STRIPE_API_KEY');
  },
  get STRIPE_SECRET_KEY(): string {
    return readEnv('STRIPE_SECRET_KEY');
  }
};

export default envSetup;
