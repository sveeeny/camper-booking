import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateDownloadToken(payload: { bookingId: string }, expiresIn = '10m'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyDownloadToken(token: string): { bookingId: string } {
  return jwt.verify(token, JWT_SECRET) as { bookingId: string };
}
