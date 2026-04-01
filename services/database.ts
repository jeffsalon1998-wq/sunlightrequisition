
import { createClient } from "@libsql/client";
import { InventoryItem, Requisition, Department } from "../types";
import { INITIAL_REQUISITIONS } from "../constants";

// Database Credentials
// Hardcoded as requested by user - WARNING: This is a security risk
const DB_URL = "https://warehousekimi-vercel-icfg-tf7wnf43zngjwvbur4t9rp6n.aws-us-east-1.turso.io";
const DB_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUwMzc2NzIsImlkIjoiMDE5Y2E3OGUtNDgwMS03OWU1LWE5YzUtYWJhY2I3OTI3YzEwIiwicmlkIjoiNDBlYjZkNTMtYWVlYi00NDQ3LWE3OGYtNDA3ZTZlOTkxM2U2In0.t9JpuUguomy0WVAp1HzPnsE3b46qAbMiS4ocV2g2lZVhf1pmA28Wm6sFyYHVbXsdZcFOR7IPhbaRxEgi9BE5Bg";

// Hardcoded Device ID for department verification
export const DEVICE_ID = 'device_001';

// Fallback mechanism for when the database is unreachable
let isUsingFallback = !DB_URL;
let connectionTested = false;

export const dbClient = DB_URL ? createClient({
  url: DB_URL,
  authToken: DB_TOKEN,
}) : null;

// Local storage keys
const LS_REQUISITIONS = 'sunlight_fallback_requisitions';

export const initDatabase = async () => {
  if (connectionTested && isUsingFallback) return;
  
  if (!dbClient) {
    console.warn("No database URL provided. Using local storage fallback.");
    isUsingFallback = true;
    connectionTested = true;
    return;
  }

  try {
    // Test connection with a simple query and a timeout-like behavior
    // We use a short-lived query to see if the endpoint is even alive
    await dbClient.execute("SELECT 1");
    isUsingFallback = false;
    
    // 1. Requisitions Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        department TEXT,
        requester TEXT,
        date TEXT,
        status TEXT,
        remarks TEXT,
        pr_for TEXT,
        description TEXT,
        items TEXT,
        event_date TEXT,
        rejection_reason TEXT
      )
    `);
    
    // 2. Items Table (Inventory)
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        uom TEXT,
        unitCost REAL,
        parStock REAL
      )
    `);

    // 3. Batches Table (Stock levels)
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT,
        quantity REAL,
        expiry_date TEXT,
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);

    // 4. App Config Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // 5. Config Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value_json TEXT
      )
    `);

    // 6. Requests Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        department TEXT,
        requester TEXT,
        date TEXT,
        status TEXT,
        remarks TEXT,
        description TEXT,
        event_date TEXT,
        rejection_reason TEXT
      )
    `);
    
    // Migration: Add event_date column if it doesn't exist
    try {
      await dbClient.execute("ALTER TABLE requisitions ADD COLUMN event_date TEXT");
    } catch (e) {}

    // Migration: Add rejection_reason column if it doesn't exist
    try {
      await dbClient.execute("ALTER TABLE requisitions ADD COLUMN rejection_reason TEXT");
    } catch (e) {}

    // Migration: Add pr_for column if it doesn't exist
    try {
      await dbClient.execute("ALTER TABLE requisitions ADD COLUMN pr_for TEXT");
    } catch (e) {}

    // Ensure default admin password exists
    const passCheck = await dbClient.execute({
      sql: "SELECT value FROM app_config WHERE key = ?",
      args: ["admin_password"]
    });
    
    if (passCheck.rows.length === 0) {
      await dbClient.execute({
        sql: "INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)",
        args: ["admin_password", "luxe123"]
      });
    }

    // Ensure default background configuration exists
    const bgCheck = await dbClient.execute({
      sql: "SELECT value_json FROM config WHERE key = ?",
      args: ["bg_config"]
    });

    if (bgCheck.rows.length === 0) {
      const defaultConfig = {
        bgUrlDark: '',
        bgUrlLight: 'https://i.ibb.co/FkH6MZVk/486295351-1190977103027465-6274870662942126036-n-1.jpg'
      };
      await dbClient.execute({
        sql: "INSERT OR IGNORE INTO config (key, value_json) VALUES (?, ?)",
        args: ["bg_config", JSON.stringify(defaultConfig)]
      });
    }

    // Seed Requisitions if empty
    const reqCount = await dbClient.execute("SELECT COUNT(*) as count FROM requisitions");
    if (Number(reqCount.rows[0].count) === 0) {
      for (const req of INITIAL_REQUISITIONS) {
        await dbClient.execute({
          sql: "INSERT INTO requisitions (id, department, requester, date, status, remarks, description, items, event_date, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null]
        });
      }
    }
  } catch (err) {
    // If it's a "Failed to fetch" error, it's a network/CORS issue
    const isNetworkError = err instanceof Error && (err.message.includes('fetch') || err.message.includes('NetworkError'));
    
    if (isNetworkError) {
      console.warn("Database connection failed (Network/CORS). Falling back to local storage.");
    } else {
      console.error("Database initialization error:", err);
    }
    
    isUsingFallback = true;
  } finally {
    connectionTested = true;
  }
};

export const registerDeviceDepartment = async (department: string) => {
  await saveConfig(`device_dept_${DEVICE_ID}`, department);
};

export const getDeviceDepartment = async (): Promise<string | null> => {
  return await getConfig(`device_dept_${DEVICE_ID}`);
};

export const saveDepartmentPassword = async (department: string, password: string) => {
  if (isUsingFallback || !dbClient) return;
  try {
    await dbClient.execute({
      sql: "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)",
      args: [`dept_pass_${department}`, password]
    });
  } catch (error) {
    console.error("Error saving department password:", error);
  }
};

export const verifyDepartmentPassword = async (department: string, password: string): Promise<boolean> => {
  if (isUsingFallback || !dbClient) return false;
  try {
    const result = await dbClient.execute({
      sql: "SELECT value FROM app_config WHERE key = ?",
      args: [`dept_pass_${department}`]
    });
    if (result.rows.length > 0) {
      return String(result.rows[0].value) === password;
    }
    return false;
  } catch (error) {
    console.error("Error verifying department password:", error);
    return false;
  }
};

export const getDepartmentsFromConfig = async (): Promise<Department[]> => {
  if (!connectionTested) await initDatabase();
  if (isUsingFallback || !dbClient) return [];
  try {
    const result = await dbClient.execute("SELECT value_json FROM config WHERE key = 'system_config'");
    if (result.rows.length > 0) {
      const config = JSON.parse(String(result.rows[0].value_json));
      if (config.departments && Array.isArray(config.departments)) {
        return config.departments as Department[];
      }
    }
    return [];
  } catch (error) {
    // Only log if it's not a network error we already know about
    if (!(error instanceof Error && error.message.includes('fetch'))) {
      console.error("Error fetching departments from config:", error);
    }
    return [];
  }
};

export const saveConfig = async (key: string, value: any) => {
  if (isUsingFallback || !dbClient) return;
  try {
    await dbClient.execute({
      sql: "INSERT OR REPLACE INTO config (key, value_json) VALUES (?, ?)",
      args: [key, JSON.stringify(value)]
    });
  } catch (error) {
    console.error("Error saving config:", error);
  }
};

export const getConfig = async (key: string): Promise<any | null> => {
  if (isUsingFallback || !dbClient) return null;
  try {
    const result = await dbClient.execute({
      sql: "SELECT value_json FROM config WHERE key = ?",
      args: [key]
    });
    if (result.rows.length > 0) {
      return JSON.parse(String(result.rows[0].value_json));
    }
    return null;
  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
};

export const getInventoryCategories = async (): Promise<string[]> => {
  if (!connectionTested) await initDatabase();
  if (isUsingFallback || !dbClient) return [];
  try {
    const result = await dbClient.execute("SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != '' ORDER BY category ASC");
    return result.rows.map(row => String(row.category));
  } catch (error) {
    return [];
  }
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  if (!connectionTested) await initDatabase();
  if (isUsingFallback || !dbClient) return [];
  try {
    const result = await dbClient.execute(`
      SELECT 
        i.id, 
        i.name, 
        i.category, 
        i.uom, 
        i.unitCost, 
        i.parStock, 
        COALESCE(SUM(b.quantity), 0) as total_stock
      FROM items i
      LEFT JOIN batches b ON i.id = b.item_id
      GROUP BY i.id
    `);
    return result.rows
      .map(row => {
        return {
          id: String(row.id),
          name: String(row.name),
          category: String(row.category || 'General'),
          stock: Number(row.total_stock || 0),
          minStock: Number(row.parStock || 0),
          unit: String(row.uom || 'Units'),
          pricePerUnit: Number(row.unitCost || 0)
        };
      });
  } catch (error) {
    return [];
  }
};

export const getRequisitions = async (): Promise<Requisition[]> => {
  if (!connectionTested) await initDatabase();
  if (isUsingFallback || !dbClient) {
    const saved = localStorage.getItem(LS_REQUISITIONS);
    return saved ? JSON.parse(saved) : INITIAL_REQUISITIONS;
  }
  try {
    const result = await dbClient.execute("SELECT * FROM requisitions ORDER BY date DESC");
    return result.rows.map(row => {
      const itemsJsonString = String(row.items)
        .replace(/"bought":\s*"yes"/g, '"bought": true')
        .replace(/"bought":\s*"no"/g, '"bought": false');

      try {
        return {
          id: String(row.id),
          department: row.department as any,
          requester: String(row.requester),
          date: String(row.date),
          status: row.status as any,
          remarks: row.remarks as any,
          prFor: row.pr_for as any,
          description: String(row.description),
          items: JSON.parse(itemsJsonString),
          eventDate: row.event_date ? String(row.event_date) : undefined,
          rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined
        };
      } catch (parseError) {
        return {
          id: String(row.id),
          department: row.department as any,
          requester: String(row.requester),
          date: String(row.date),
          status: row.status as any,
          remarks: row.remarks as any,
          prFor: row.pr_for as any,
          description: String(row.description),
          items: [],
          eventDate: row.event_date ? String(row.event_date) : undefined,
          rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined
        };
      }
    });
  } catch (error) {
    return INITIAL_REQUISITIONS;
  }
};

export const saveRequisitionDb = async (req: Requisition) => {
  if (isUsingFallback || !dbClient) {
    const requisitions = await getRequisitions();
    const updated = [req, ...requisitions];
    localStorage.setItem(LS_REQUISITIONS, JSON.stringify(updated));
    return;
  }
  try {
    await dbClient.execute({
      sql: "INSERT OR REPLACE INTO requisitions (id, department, requester, date, status, remarks, pr_for, description, items, event_date, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.prFor || null, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null]
    });
  } catch (err) {
    console.error("Failed to save to DB:", err);
    throw err;
  }
};

export const updateRequisitionDb = async (req: Requisition) => {
  if (isUsingFallback || !dbClient) {
    const requisitions = await getRequisitions();
    const updated = requisitions.map(r => r.id === req.id ? req : r);
    localStorage.setItem(LS_REQUISITIONS, JSON.stringify(updated));
    return;
  }
  await dbClient.execute({
    sql: "UPDATE requisitions SET department = ?, requester = ?, date = ?, status = ?, remarks = ?, pr_for = ?, description = ?, items = ?, event_date = ?, rejection_reason = ? WHERE id = ?",
    args: [req.department, req.requester, req.date, req.status, req.remarks, req.prFor || null, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null, req.id]
  });
};

export const updateStatusDb = async (id: string, status: string, reason?: string | null) => {
  if (isUsingFallback || !dbClient) {
    const requisitions = await getRequisitions();
    const updated = requisitions.map(r => r.id === id ? { ...r, status: status as any, rejectionReason: reason || undefined } : r);
    localStorage.setItem(LS_REQUISITIONS, JSON.stringify(updated));
    return;
  }
  if (reason !== undefined) {
    await dbClient.execute({
      sql: "UPDATE requisitions SET status = ?, rejection_reason = ? WHERE id = ?",
      args: [status, reason, id]
    });
  } else {
    await dbClient.execute({
      sql: "UPDATE requisitions SET status = ? WHERE id = ?",
      args: [status, id]
    });
  }
};

export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  if (isUsingFallback || !dbClient) {
    return password === (process.env.VITE_ADMIN_PASSWORD || 'luxe123');
  }
  try {
    const result = await dbClient.execute({
      sql: "SELECT value FROM app_config WHERE key = ?",
      args: ["admin_password"]
    });
    
    if (result.rows.length > 0) {
      return String(result.rows[0].value) === password;
    }
    return password === (process.env.VITE_ADMIN_PASSWORD || 'luxe123'); // Fallback
  } catch (error) {
    console.error("Error verifying password:", error);
    return password === (process.env.VITE_ADMIN_PASSWORD || 'luxe123');
  }
};
