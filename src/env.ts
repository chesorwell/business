function assertEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const DATABASE_URL = assertEnv('DATABASE_URL');
export const CENSUS_API_KEY = assertEnv('CENSUS_API_KEY');
