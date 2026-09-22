import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { authRouter } from './server/routes/auth';
import {
  INITIAL_ASSETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_PROJECTS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from './src/data/mockData';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetTransaction,
  AuditLog,
  DashboardStats,
  Location,
  Project,
  User,
} from './src/types';
import * as MESSAGES from './shared/messages';

// In-memory persistent database store (Ready for On-Premise SQLite/PostgreSQL adaptation)
let projects: Project[] = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
let assets: Asset[] = JSON.parse(JSON.stringify(INITIAL_ASSETS));
let locations: Location[] = JSON.parse(JSON.stringify(INITIAL_LOCATIONS));
let users: User[] = JSON.parse(JSON.stringify(INITIAL_USERS));
let categories: AssetCategory[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
let transactions: AssetTransaction[] = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
let auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

function getUser(userId?: string | null): User | undefined {
  return users.find((u) => u.user_id === userId);
}

function getLocation(locationId?: string | null): Location | undefined {
  return locations.find((l) => l.location_id === locationId);
}

function getProject(projectId?: string | null): Project | undefined {
  return projects.find((p) => p.project_id === projectId);
}

function addAuditLog(
  userName: string,
  action: string,
  assetId: string,
  assetName: string,
  locationName: string,
  details?: string
) {
  const log: AuditLog = {
    id: `AUDIT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
    user_name: userName,
    action,
    asset_id: assetId,
    asset_name: assetName,
    location_name: locationName,
    timestamp: new Date().toISOString(),
    details,
  };
  auditLogs.unshift(log);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100kb' }));
  app.use('/api/auth', authRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Reset to initial seed data
  app.post('/api/reset-data', (_req, res) => {
    projects = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
    assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    locations = JSON.parse(JSON.stringify(INITIAL_LOCATIONS));
    users = JSON.parse(JSON.stringify(INITIAL_USERS));
    categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
    auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    res.json({ success: true, message: MESSAGES.RESET_DATA_SUCCESS });
  });

  // Projects list (Multi-Project Support for Construction Companies)
  app.get('/api/projects', (_req, res) => {
    res.json(projects);
  });

  // Create new project / construction site
  app.post('/api/projects', (req, res) => {
    const { project_name, project_code, address, manager_user_id, description, status } = req.body;
    if (!project_name || !project_code) {
      return res.status(400).json({ error: MESSAGES.PROJECT_FIELDS_REQUIRED });
    }
    const cleanCode = project_code.trim().toUpperCase();
    const cleanName = project_name.trim();
    const newProjectId = `PROJ-${Date.now().toString().slice(-4)}`;

    const newProject: Project = {
      project_id: newProjectId,
      project_name: cleanName,
      project_code: cleanCode,
      address: address || '',
      manager_user_id: manager_user_id || 'USER-004',
      status: status || 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      description: description || '',
    };
    projects.push(newProject);

    // Auto-bootstrap root Site & default Warehouse for the new project
    const siteId = `LOC-SITE-${cleanCode.replace(/[^A-Z0-9]/g, '') || Date.now().toString().slice(-4)}`;
    const rootSite: Location = {
      location_id: siteId,
      location_name: `Site (${cleanName})`,
      location_type: 'SITE',
      parent_location_id: null,
      project_id: newProjectId,
      description: `Khu vực công trường chính - ${cleanName}`,
      is_active: true,
    };
    locations.push(rootSite);

    const defaultWarehouse: Location = {
      location_id: `LOC-WH-${cleanCode.replace(/[^A-Z0-9]/g, '') || Date.now().toString().slice(-4)}`,
      location_name: `Kho thiết bị & vật tư (${cleanCode})`,
      location_type: 'ROOM',
      parent_location_id: siteId,
      project_id: newProjectId,
      description: `Kho lưu trữ và bàn giao dụng cụ tập trung tại ${cleanName}`,
      is_active: true,
    };
    locations.push(defaultWarehouse);

    res.status(201).json(newProject);
  });

  // Users list
  app.get('/api/users', (_req, res) => {
    res.json(users);
  });

  // Categories list
  app.get('/api/categories', (_req, res) => {
    res.json(categories);
  });

  // Locations list
  app.get('/api/locations', (req, res) => {
    const { project_id } = req.query;
    if (project_id && project_id !== 'ALL') {
      return res.json(locations.filter((l) => l.project_id === project_id));
    }
    res.json(locations);
  });

  // Create location
  app.post('/api/locations', (req, res) => {
    const { location_name, location_type, parent_location_id, project_id, description } = req.body;
    if (!location_name || !location_type) {
      return res.status(400).json({ error: MESSAGES.LOCATION_FIELDS_REQUIRED });
    }
    const newLocation: Location = {
      location_id: `LOC-${Date.now().toString().slice(-6)}`,
      location_name: location_name.trim(),
      location_type,
      parent_location_id: parent_location_id || null,
      project_id: project_id || null,
      description: description || '',
      is_active: true,
    };
    locations.push(newLocation);
    res.status(201).json(newLocation);
  });

  // Search assets (Section 9, 21, 24)
  app.get('/api/assets/search', (req, res) => {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) {
      return res.json(assets);
    }
    const results = assets.filter((asset) => {
      const user = getUser(asset.current_user_id);
      const loc = getLocation(asset.current_location_id);
      const category = categories.find((c) => c.category_id === asset.category_id);

      return (
        asset.asset_id.toLowerCase().includes(q) ||
        asset.asset_name.toLowerCase().includes(q) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
        (asset.qr_code && asset.qr_code.toLowerCase().includes(q)) ||
        (user && user.name.toLowerCase().includes(q)) ||
        (loc && loc.location_name.toLowerCase().includes(q)) ||
        (category && category.category_name.toLowerCase().includes(q)) ||
        asset.status.toLowerCase().includes(q)
      );
    });
    res.json(results);
  });

  // Get all assets with optional filtering
  app.get('/api/assets', (req, res) => {
    let result = [...assets];
    const { status, category, location, user, project, search } = req.query;

    if (project && project !== 'ALL') {
      result = result.filter((a) => a.project_id === project);
    }
    if (status && status !== 'ALL') {
      result = result.filter((a) => a.status === status);
    }
    if (category && category !== 'ALL') {
      result = result.filter((a) => a.category_id === category);
    }
    if (location && location !== 'ALL') {
      result = result.filter((a) => a.current_location_id === location);
    }
    if (user && user !== 'ALL') {
      result = result.filter((a) => a.current_user_id === user);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(
        (a) =>
          a.asset_id.toLowerCase().includes(q) ||
          a.asset_name.toLowerCase().includes(q) ||
          (a.serial_number && a.serial_number.toLowerCase().includes(q))
      );
    }
    res.json(result);
  });

  // Robust asset finder by ID, QR code, Serial Number, or RFID tag (Mobile-friendly barcode support)
  function findAsset(param: string | undefined): Asset | undefined {
    if (!param) return undefined;
    const clean = decodeURIComponent(param).trim().toLowerCase();
    const stripped = clean.replace(/^smart-asset:/i, '').trim();
    return assets.find(
      (a) =>
        a.asset_id.toLowerCase() === clean ||
        a.asset_id.toLowerCase() === stripped ||
        a.qr_code.toLowerCase() === clean ||
        a.qr_code.toLowerCase() === `smart-asset:${clean}` ||
        (a.serial_number && a.serial_number.toLowerCase() === clean) ||
        (a.rfid_code && a.rfid_code.toLowerCase() === clean)
    );
  }

  function findAssetIndex(param: string | undefined): number {
    if (!param) return -1;
    const clean = decodeURIComponent(param).trim().toLowerCase();
    const stripped = clean.replace(/^smart-asset:/i, '').trim();
    return assets.findIndex(
      (a) =>
        a.asset_id.toLowerCase() === clean ||
        a.asset_id.toLowerCase() === stripped ||
        a.qr_code.toLowerCase() === clean ||
        a.qr_code.toLowerCase() === `smart-asset:${clean}` ||
        (a.serial_number && a.serial_number.toLowerCase() === clean) ||
        (a.rfid_code && a.rfid_code.toLowerCase() === clean)
    );
  }

  // Get single asset
  app.get('/api/assets/:assetId', (req, res) => {
    const { assetId } = req.params;
    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }
    res.json(asset);
  });

  // Create new asset (Section 5, AC-001)
  app.post('/api/assets', (req, res) => {
    const {
      asset_id,
      asset_name,
      category_id,
      serial_number,
      rfid_code,
      current_location_id,
      description,
      status,
    } = req.body;

    if (!asset_name || !category_id) {
      return res.status(400).json({ error: MESSAGES.ASSET_FIELDS_REQUIRED });
    }

    // Auto-generate or validate unique asset_id
    const finalAssetId = (asset_id || `ASSET-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const existing = assets.find((a) => a.asset_id.toUpperCase() === finalAssetId);
    if (existing) {
      return res.status(409).json({ error: MESSAGES.ASSET_ID_EXISTS(finalAssetId) });
    }

    const qrCode = `SMART-ASSET:${finalAssetId}`;
    const now = new Date().toISOString();

    const newAsset: Asset = {
      asset_id: finalAssetId,
      asset_name: asset_name.trim(),
      category_id,
      serial_number: serial_number ? serial_number.trim() : undefined,
      qr_code: qrCode,
      rfid_code: rfid_code ? rfid_code.trim() : undefined,
      status: status || AssetStatus.AVAILABLE,
      current_location_id: current_location_id || 'LOC-WAREHOUSE',
      current_user_id: null,
      created_at: now,
      updated_at: now,
      description: description || '',
      is_active: true,
    };

    assets.unshift(newAsset);

    const loc = getLocation(newAsset.current_location_id);
    addAuditLog(
      'Admin',
      'CREATED ASSET',
      newAsset.asset_id,
      newAsset.asset_name,
      loc?.location_name || 'Warehouse',
      MESSAGES.NEW_ASSET_AUDIT_NOTE(newAsset.asset_name)
    );

    res.status(201).json(newAsset);
  });

  // Update asset details
  app.put('/api/assets/:assetId', (req, res) => {
    const { assetId } = req.params;
    const index = findAssetIndex(assetId);
    if (index === -1) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }

    const { asset_name, category_id, serial_number, rfid_code, description, is_active } = req.body;
    assets[index] = {
      ...assets[index],
      asset_name: asset_name !== undefined ? asset_name : assets[index].asset_name,
      category_id: category_id !== undefined ? category_id : assets[index].category_id,
      serial_number: serial_number !== undefined ? serial_number : assets[index].serial_number,
      rfid_code: rfid_code !== undefined ? rfid_code : assets[index].rfid_code,
      description: description !== undefined ? description : assets[index].description,
      is_active: is_active !== undefined ? is_active : assets[index].is_active,
      updated_at: new Date().toISOString(),
    };

    res.json(assets[index]);
  });

  // Patch asset status (Section 6, 16)
  app.patch('/api/assets/:assetId/status', (req, res) => {
    const { assetId } = req.params;
    const { status, note, user_id } = req.body;
    const asset = findAsset(assetId);

    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }
    if (!Object.values(AssetStatus).includes(status)) {
      return res.status(400).json({ error: MESSAGES.INVALID_ASSET_STATUS });
    }

    const prevStatus = asset.status;
    asset.status = status;
    if (status !== AssetStatus.IN_USE) {
      asset.current_user_id = null;
    }
    asset.updated_at = new Date().toISOString();

    // Record transaction
    const tx: AssetTransaction = {
      transaction_id: `TX-${Date.now().toString().slice(-6)}`,
      asset_id: asset.asset_id,
      transaction_type: 'STATUS_CHANGE',
      user_id: user_id || 'USER-005',
      location_id: asset.current_location_id || 'LOC-WAREHOUSE',
      timestamp: new Date().toISOString(),
      note: note || MESSAGES.STATUS_CHANGE_NOTE(prevStatus, status),
      previous_status: prevStatus,
      new_status: status,
    };
    transactions.unshift(tx);

    const user = getUser(user_id) || getUser('USER-005');
    const loc = getLocation(asset.current_location_id);
    addAuditLog(
      user?.name || 'System Admin',
      'STATUS CHANGED',
      asset.asset_id,
      asset.asset_name,
      loc?.location_name || 'Warehouse',
      MESSAGES.STATUS_AUDIT_NOTE(status)
    );

    res.json(asset);
  });

  // Check-out Asset (Section 11, AC-003, AC-004, BR-001, BR-002, BR-004)
  app.post('/api/assets/:assetId/checkout', (req, res) => {
    const { assetId } = req.params;
    const { user_id, location_id, note, expected_return_at } = req.body;

    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }

    // BR-004: Cannot checkout if already in use, maintenance, lost, or inactive
    if (asset.status === AssetStatus.IN_USE) {
      const currentUser = getUser(asset.current_user_id);
      return res.status(400).json({
        error: MESSAGES.ASSET_IN_USE(currentUser ? currentUser.name : 'another user'),
      });
    }
    if (asset.status === AssetStatus.MAINTENANCE) {
      return res.status(400).json({ error: MESSAGES.ASSET_MAINTENANCE });
    }
    if (asset.status === AssetStatus.LOST) {
      return res.status(400).json({ error: MESSAGES.ASSET_LOST });
    }
    if (asset.status === AssetStatus.DAMAGED) {
      return res.status(400).json({ error: MESSAGES.ASSET_DAMAGED });
    }
    if (!asset.is_active || asset.status === AssetStatus.INACTIVE) {
      return res.status(400).json({ error: MESSAGES.ASSET_INACTIVE });
    }

    if (!user_id) {
      return res.status(400).json({ error: MESSAGES.CHECKOUT_USER_REQUIRED });
    }

    const previousStatus = asset.status;
    const now = new Date().toISOString();

    // Update asset
    asset.status = AssetStatus.IN_USE;
    asset.current_user_id = user_id;
    if (location_id) {
      asset.current_location_id = location_id;
    }
    asset.checked_out_at = now;
    asset.expected_return_at = expected_return_at || null;
    asset.updated_at = now;

    // BR-006: Create transaction
    const tx: AssetTransaction = {
      transaction_id: `TX-${Date.now().toString().slice(-6)}`,
      asset_id: asset.asset_id,
      transaction_type: 'CHECK_OUT',
      user_id,
      location_id: asset.current_location_id || 'LOC-WAREHOUSE',
      timestamp: now,
      note: note || MESSAGES.CHECKOUT_NOTE,
      previous_status: previousStatus,
      new_status: AssetStatus.IN_USE,
    };
    transactions.unshift(tx);

    const user = getUser(user_id);
    const loc = getLocation(asset.current_location_id);
    addAuditLog(
      user?.name || 'Staff User',
      'CHECKED OUT',
      asset.asset_id,
      asset.asset_name,
      loc?.location_name || 'Location',
      note || MESSAGES.CHECKOUT_NOTE
    );

    res.json({
      success: true,
      message: MESSAGES.CHECKOUT_SUCCESS,
      asset,
      transaction: tx,
    });
  });

  // Check-in Asset (Section 13, AC-005, BR-003, BR-005)
  app.post('/api/assets/:assetId/checkin', (req, res) => {
    const { assetId } = req.params;
    const { location_id, note, returned_by_user_id, condition_status } = req.body;

    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }

    const previousStatus = asset.status;
    const previousUser = getUser(asset.current_user_id);
    const now = new Date().toISOString();
    const returnLocId = location_id || 'LOC-WAREHOUSE';

    // Target status (default AVAILABLE, or DAMAGED/MAINTENANCE if reported)
    const targetStatus = condition_status && Object.values(AssetStatus).includes(condition_status)
      ? condition_status
      : AssetStatus.AVAILABLE;

    asset.status = targetStatus;
    asset.current_user_id = null;
    asset.current_location_id = returnLocId;
    asset.checked_out_at = null;
    asset.expected_return_at = null;
    asset.updated_at = now;

    // Record transaction
    const tx: AssetTransaction = {
      transaction_id: `TX-${Date.now().toString().slice(-6)}`,
      asset_id: asset.asset_id,
      transaction_type: 'CHECK_IN',
      user_id: returned_by_user_id || previousUser?.user_id || 'USER-001',
      location_id: returnLocId,
      timestamp: now,
      note: note || MESSAGES.CHECKIN_NOTE,
      previous_status: previousStatus,
      new_status: targetStatus,
    };
    transactions.unshift(tx);

    const user = getUser(tx.user_id);
    const loc = getLocation(returnLocId);
    addAuditLog(
      user?.name || previousUser?.name || 'Staff User',
      'CHECKED IN',
      asset.asset_id,
      asset.asset_name,
      loc?.location_name || 'Warehouse',
      note || MESSAGES.CHECKIN_AUDIT_NOTE(loc?.location_name || 'Kho')
    );

    res.json({
      success: true,
      message: MESSAGES.CHECKIN_SUCCESS,
      asset,
      transaction: tx,
    });
  });

  // Move Asset (Section 14, BR-006)
  app.post('/api/assets/:assetId/move', (req, res) => {
    const { assetId } = req.params;
    const { location_id, note, user_id } = req.body;

    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }
    if (!location_id) {
      return res.status(400).json({ error: MESSAGES.LOCATION_REQUIRED });
    }

    const previousLocation = getLocation(asset.current_location_id);
    const newLocation = getLocation(location_id);
    const now = new Date().toISOString();

    asset.current_location_id = location_id;
    asset.updated_at = now;

    const performerUserId = user_id || asset.current_user_id || 'USER-001';

    // Record transaction
    const tx: AssetTransaction = {
      transaction_id: `TX-${Date.now().toString().slice(-6)}`,
      asset_id: asset.asset_id,
      transaction_type: 'MOVE',
      user_id: performerUserId,
      location_id: location_id,
      timestamp: now,
      note: note || MESSAGES.MOVE_NOTE(previousLocation?.location_name || 'vị trí cũ', newLocation?.location_name || 'vị trí mới'),
      previous_status: asset.status,
      new_status: asset.status,
    };
    transactions.unshift(tx);

    const user = getUser(performerUserId);
    addAuditLog(
      user?.name || 'Staff User',
      'MOVED',
      asset.asset_id,
      asset.asset_name,
      newLocation?.location_name || 'Location',
      MESSAGES.MOVE_AUDIT_NOTE(newLocation?.location_name || location_id)
    );

    res.json({
      success: true,
      message: MESSAGES.ASSET_MOVED_SUCCESS,
      asset,
      transaction: tx,
    });
  });

  // Transfer Asset between Projects/Construction Sites
  app.post('/api/assets/:assetId/transfer-project', (req, res) => {
    const { assetId } = req.params;
    const { to_project_id, location_id, note, user_id } = req.body;

    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }
    if (!to_project_id) {
      return res.status(400).json({ error: MESSAGES.PROJECT_REQUIRED });
    }

    const fromProject = getProject(asset.project_id);
    const toProject = getProject(to_project_id);
    const prevProjId = asset.project_id;
    const now = new Date().toISOString();

    asset.project_id = to_project_id;
    if (location_id) {
      asset.current_location_id = location_id;
    }
    asset.updated_at = now;

    const performerUserId = user_id || 'USER-004';
    const tx: AssetTransaction = {
      transaction_id: `TX-${Date.now().toString().slice(-6)}`,
      asset_id: asset.asset_id,
      transaction_type: 'PROJECT_TRANSFER',
      user_id: performerUserId,
      location_id: asset.current_location_id || 'LOC-WAREHOUSE',
      from_project_id: prevProjId,
      to_project_id,
      timestamp: now,
      note: note || MESSAGES.TRANSFER_NOTE(toProject?.project_name || to_project_id),
      previous_status: asset.status,
      new_status: asset.status,
    };
    transactions.unshift(tx);

    const user = getUser(performerUserId);
    addAuditLog(
      user?.name || 'Project Manager',
      'PROJECT TRANSFER',
      asset.asset_id,
      asset.asset_name,
      toProject?.project_name || 'Dự án mới',
      MESSAGES.TRANSFER_AUDIT_NOTE(fromProject?.project_name || 'Kho', toProject?.project_name || to_project_id)
    );

    res.json({
      success: true,
      message: MESSAGES.ASSET_TRANSFER_SUCCESS,
      asset,
      transaction: tx,
    });
  });

  // Get Asset History (Section 15, 16)
  app.get('/api/assets/:assetId/history', (req, res) => {
    const { assetId } = req.params;
    const asset = findAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: MESSAGES.ASSET_NOT_FOUND() });
    }

    const history = transactions
      .filter((t) => t.asset_id.toLowerCase() === asset.asset_id.toLowerCase())
      .map((t) => {
        const user = getUser(t.user_id);
        const loc = getLocation(t.location_id);
        return {
          ...t,
          user_name: user ? user.name : t.user_id,
          location_name: loc ? loc.location_name : t.location_id,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(history);
  });

  // Audit Logs (Section 23)
  app.get('/api/audit-logs', (_req, res) => {
    res.json(auditLogs);
  });

  // Dashboard Stats (Section 20 & 22)
  app.get('/api/dashboard/stats', (req, res) => {
    const { project } = req.query;
    let targetAssets = assets;
    if (project && project !== 'ALL') {
      targetAssets = assets.filter((a) => a.project_id === project);
    }

    const total_assets = targetAssets.length;
    const available = targetAssets.filter((a) => a.status === AssetStatus.AVAILABLE).length;
    const in_use = targetAssets.filter((a) => a.status === AssetStatus.IN_USE).length;
    const maintenance = targetAssets.filter((a) => a.status === AssetStatus.MAINTENANCE).length;
    const lost = targetAssets.filter((a) => a.status === AssetStatus.LOST).length;
    const damaged = targetAssets.filter((a) => a.status === AssetStatus.DAMAGED).length;
    const inactive = targetAssets.filter((a) => a.status === AssetStatus.INACTIVE || !a.is_active).length;

    // Assets by location
    const locationMap = new Map<string, number>();
    locations.forEach((l) => locationMap.set(l.location_name, 0));
    targetAssets.forEach((a) => {
      const loc = getLocation(a.current_location_id);
      const name = loc ? loc.location_name : 'Chưa phân bổ';
      locationMap.set(name, (locationMap.get(name) || 0) + 1);
    });

    const assets_by_location = Array.from(locationMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([location_name, count]) => ({ location_name, count }))
      .sort((a, b) => b.count - a.count);

    // Assets currently in use
    const nowTime = new Date().getTime();
    const assets_currently_in_use = targetAssets
      .filter((a) => a.status === AssetStatus.IN_USE)
      .map((a) => {
        const user = getUser(a.current_user_id);
        const loc = getLocation(a.current_location_id);
        const is_overdue = a.expected_return_at
          ? new Date(a.expected_return_at).getTime() < nowTime
          : false;

        return {
          asset_id: a.asset_id,
          asset_name: a.asset_name,
          user_name: user ? user.name : 'Unknown',
          location_name: loc ? loc.location_name : 'Unknown Location',
          checked_out_at: a.checked_out_at || a.updated_at,
          expected_return_at: a.expected_return_at,
          is_overdue,
        };
      });

    const overdue_count = assets_currently_in_use.filter((a) => a.is_overdue).length;

    const stats: DashboardStats = {
      total_assets,
      available,
      in_use,
      maintenance,
      lost,
      damaged,
      inactive,
      assets_by_location,
      assets_currently_in_use,
      overdue_count,
      lost_count: lost,
    };

    res.json(stats);
  });

  app.use(((error: unknown, _req, res, _next) => {
    console.error('Unhandled request failed.', error instanceof Error ? error.name : 'Unknown error');
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: MESSAGES.SYSTEM_ERROR },
    });
  }) as express.ErrorRequestHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Asset Finder server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
