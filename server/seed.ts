import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { INITIAL_ASSETS, INITIAL_CATEGORIES, INITIAL_LOCATIONS, INITIAL_PROJECTS, INITIAL_USERS } from '../src/data/mockData.js';
import { closePool, getPool, withTransaction } from './db.js';

const seedPasswords: Record<string, string> = {
  'USER-005': 'Admin@123456',
  'USER-004': 'Manager@123456',
  'USER-001': 'Worker@123456',
  'USER-002': 'Worker@123456',
  'USER-003': 'Worker@123456',
};

const seedEmails: Record<string, string> = {
  'USER-005': 'admin@assetmate.vn',
  'USER-004': 'kho.hanoi@assetmate.vn',
  'USER-001': 'kythuat@assetmate.vn',
};

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed default credentials in production.');
  }

  await withTransaction(async (client) => {
    for (const user of INITIAL_USERS) {
      const passwordHash = await bcrypt.hash(seedPasswords[user.user_id], 12);
      await client.query(
        `INSERT INTO users (user_id, name, email, password_hash, role, department, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.user_id, user.name, seedEmails[user.user_id] || user.email, passwordHash, user.role, user.department, user.avatar || null]
      );
    }

    for (const project of INITIAL_PROJECTS) {
      await client.query(
        `INSERT INTO projects (project_id, project_name, project_code, address, manager_user_id, status, start_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (project_id) DO NOTHING`,
        [project.project_id, project.project_name, project.project_code, project.address || null, project.manager_user_id || null, project.status, project.start_date || null, project.description || null]
      );
      for (const user of INITIAL_USERS) {
        await client.query(
          'INSERT INTO project_memberships (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [project.project_id, user.user_id]
        );
      }
    }

    for (const category of INITIAL_CATEGORIES) {
      await client.query(
        `INSERT INTO asset_categories (category_id, category_name, description, icon)
         VALUES ($1, $2, $3, $4) ON CONFLICT (category_id) DO NOTHING`,
        [category.category_id, category.category_name, category.description || null, category.icon || null]
      );
    }

    for (const location of INITIAL_LOCATIONS) {
      await client.query(
        `INSERT INTO locations (location_id, project_id, location_name, location_type, parent_location_id, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (location_id) DO NOTHING`,
        [location.location_id, location.project_id, location.location_name, location.location_type, location.parent_location_id, location.description || null, location.is_active]
      );
    }

    for (const asset of INITIAL_ASSETS) {
      await client.query(
        `INSERT INTO assets (
          asset_id, asset_name, category_id, project_id, serial_number, qr_code, rfid_code,
          status, current_location_id, current_user_id, checked_out_at, expected_return_at,
          description, image_url, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (asset_id) DO NOTHING`,
        [
          asset.asset_id, asset.asset_name, asset.category_id, asset.project_id, asset.serial_number || null,
          asset.qr_code, asset.rfid_code || null, asset.status, asset.current_location_id || null,
          asset.current_user_id || null, asset.checked_out_at || null, asset.expected_return_at || null,
          asset.description || null, asset.image_url || null, asset.is_active, asset.created_at, asset.updated_at,
        ]
      );
    }
  });

  console.log('Seeded AssetMate development data.');
}

seed()
  .catch((error: unknown) => {
    console.error('Seed failed.', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(closePool);
