import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_BUSINESS_SETTINGS, INITIAL_PRODUCTS } from '../src/data/catalogSeed';
import {
  AuditLogEntry,
  BusinessSettings,
  Order,
  Product,
  QuoteInquiry,
  SavedAddress,
  UserPublic,
} from '../src/types';

export interface StoredUser extends UserPublic {
  passwordHash: string;
  passwordSalt: string;
  resetCode?: string | null;
  resetExpiresAt?: number | null;
}

export interface DatabaseState {
  products: Product[];
  settings: BusinessSettings;
  users: StoredUser[];
  orders: Order[];
  quotes: QuoteInquiry[];
  auditLogs: AuditLogEntry[];
  sessionSecret: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'freshfarm-store.json');

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

export function toPublicUser(user: StoredUser): UserPublic {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    businessName: user.businessName,
    role: user.role,
    savedAddresses: user.savedAddresses,
    favoriteProductIds: user.favoriteProductIds,
    createdAt: user.createdAt,
  };
}

function createInitialState(): DatabaseState {
  const adminCreds = hashPassword(process.env.INITIAL_ADMIN_PASSWORD || 'FreshFarmDHA6!');
  const now = new Date().toISOString();

  const initialAdmin: StoredUser = {
    id: 'usr-admin-1',
    fullName: 'Fresh Farm Administrator',
    email: 'admin@freshfarmvegetables.pk',
    phone: '0333-4934403',
    businessName: 'Fresh Farm Vegetables — DHA Phase 6',
    role: 'admin',
    savedAddresses: [],
    favoriteProductIds: [],
    createdAt: now,
    passwordHash: adminCreds.hash,
    passwordSalt: adminCreds.salt,
  };

  return {
    products: structuredClone(INITIAL_PRODUCTS),
    settings: structuredClone(DEFAULT_BUSINESS_SETTINGS),
    users: [initialAdmin],
    orders: [],
    quotes: [],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorEmail: 'system',
        action: 'STORE_INITIALIZED',
        details: 'Initialized catalog with 28 local and imported vegetables with PKR pricing.',
        createdAt: now,
      },
    ],
    sessionSecret: crypto.randomBytes(32).toString('hex'),
  };
}

let cachedDb: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (cachedDb) return cachedDb;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseState;
      const seedMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
      let didBackfill = false;

      for (const existing of parsed.products) {
        const seed = seedMap.get(existing.id);
        if (!seed) continue;
        if (!existing.packageOptions || existing.packageOptions.length === 0) {
          existing.packageOptions = [...seed.packageOptions];
          didBackfill = true;
        }
        // Backfill active PKR pricing onto any legacy unpriced seed items so cart & checkout calculate PKR totals immediately
        if (existing.pricePkr === null && seed.pricePkr !== null) {
          existing.pricingMode = 'live';
          existing.pricePkr = seed.pricePkr;
          existing.priceUnit = seed.priceUnit;
          existing.priceUpdatedAt = seed.priceUpdatedAt;
          if (existing.stockStatus === 'unverified') {
            existing.stockStatus = 'in_stock';
          }
          didBackfill = true;
        }
      }

      const existingIds = new Set(parsed.products.map((p) => p.id));
      for (const seedProd of INITIAL_PRODUCTS) {
        if (!existingIds.has(seedProd.id)) {
          parsed.products.push(structuredClone(seedProd));
          didBackfill = true;
        }
      }

      // Backfill newly introduced BusinessSettings fields safely
      parsed.settings = {
        ...structuredClone(DEFAULT_BUSINESS_SETTINGS),
        ...parsed.settings,
      };
      if (!parsed.settings.email) {
        parsed.settings.email = DEFAULT_BUSINESS_SETTINGS.email;
        parsed.settings.emailVerified = DEFAULT_BUSINESS_SETTINGS.emailVerified;
        didBackfill = true;
      }
      if (!parsed.settings.lastDailyRatesPublishedAt) {
        parsed.settings.lastDailyRatesPublishedAt =
          DEFAULT_BUSINESS_SETTINGS.lastDailyRatesPublishedAt;
        didBackfill = true;
      }

      // Backfill standard zone delivery fees if legacy zones had null fees
      const seedZones = new Map(DEFAULT_BUSINESS_SETTINGS.deliveryZones.map((z) => [z.id, z]));
      if (Array.isArray(parsed.settings.deliveryZones)) {
        for (const z of parsed.settings.deliveryZones) {
          const sz = seedZones.get(z.id);
          if (sz && z.deliveryFeePkr === null && sz.deliveryFeePkr !== null) {
            z.deliveryFeePkr = sz.deliveryFeePkr;
            z.notes = sz.notes;
            didBackfill = true;
          }
        }
      }

      cachedDb = parsed;
      if (didBackfill) {
        saveDb();
      }
      return cachedDb;
    } catch {
      cachedDb = createInitialState();
      saveDb();
      return cachedDb;
    }
  }

  cachedDb = createInitialState();
  saveDb();
  return cachedDb;
}

export function saveDb(): void {
  if (!cachedDb) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(cachedDb, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function appendAuditLog(actorEmail: string, action: string, details: string): void {
  const db = getDb();
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorEmail,
    action,
    details,
    createdAt: new Date().toISOString(),
  });
  if (db.auditLogs.length > 250) {
    db.auditLogs = db.auditLogs.slice(0, 250);
  }
  saveDb();
}

export function signAuthToken(userId: string, role: 'customer' | 'admin'): string {
  const db = getDb();
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = Buffer.from(JSON.stringify({ sub: userId, role, exp })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', db.sessionSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAuthToken(token?: string): StoredUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const db = getDb();
  const expected = crypto
    .createHmac('sha256', db.sessionSecret)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub: string;
      exp: number;
    };
    if (Date.now() > decoded.exp) return null;
    return db.users.find((u) => u.id === decoded.sub) || null;
  } catch {
    return null;
  }
}

export function createSavedAddressId(): string {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function sanitizeAddress(input: Omit<SavedAddress, 'id'>, existingId?: string): SavedAddress {
  return {
    id: existingId || createSavedAddressId(),
    label: String(input.label || 'Delivery Address').trim(),
    firstName: String(input.firstName || '').trim(),
    lastName: String(input.lastName || '').trim(),
    phone: String(input.phone || '').trim(),
    streetAddress: String(input.streetAddress || '').trim(),
    apartment: String(input.apartment || '').trim(),
    city: String(input.city || 'Lahore').trim(),
    province: String(input.province || 'Punjab').trim(),
    postalCode: String(input.postalCode || '').trim(),
    zoneId: String(input.zoneId || 'lahore-dha').trim(),
  };
}
