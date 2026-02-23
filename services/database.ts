
import { createClient } from "@libsql/client";
import { InventoryItem, Requisition, Department } from "../types";
import { INITIAL_REQUISITIONS } from "../constants";

// 1. Stock Registry Database (Read-only for this app)
const STOCK_URL = import.meta.env.VITE_STOCK_DB_URL;
const STOCK_TOKEN = import.meta.env.VITE_STOCK_DB_TOKEN;

// 2. Requisitions Database (Read/Write)
const REQ_URL = import.meta.env.VITE_REQ_DB_URL;
const REQ_TOKEN = import.meta.env.VITE_REQ_DB_TOKEN;

export const stockClient = createClient({
  url: STOCK_URL,
  authToken: STOCK_TOKEN,
});

export const requestClient = createClient({
  url: REQ_URL,
  authToken: REQ_TOKEN,
});

export const initDatabase = async () => {
  try {
    // 1. Requisitions Table - Ensure event_date is part of schema
    await requestClient.execute(`
      CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        department TEXT,
        requester TEXT,
        date TEXT,
        status TEXT,
        remarks TEXT,
        description TEXT,
        items TEXT,
        event_date TEXT,
        rejection_reason TEXT
      )
    `);
    
    // Attempt to add event_date column if it doesn't exist (migration for existing databases)
    try {
      await requestClient.execute("ALTER TABLE requisitions ADD COLUMN event_date TEXT");
    } catch (e) {
      // Column likely already exists, safe to ignore
    }

    // Attempt to add rejection_reason column if it doesn't exist
    try {
      await requestClient.execute("ALTER TABLE requisitions ADD COLUMN rejection_reason TEXT");
    } catch (e) {
      // Column likely already exists
    }

    // Attempt to add bought column to items (stored in TEXT as JSON)
    // This is a conceptual change; the logic in get/save/update handles the data structure
    // No direct ALTER TABLE is needed since `items` is a TEXT column.

    // 2. App Config Table (for Password etc.)
    await requestClient.execute(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Ensure default admin password exists
    const passCheck = await requestClient.execute({
      sql: "SELECT value FROM app_config WHERE key = ?",
      args: ["admin_password"]
    });
    
    if (passCheck.rows.length === 0) {
      await requestClient.execute({
        sql: "INSERT INTO app_config (key, value) VALUES (?, ?)",
        args: ["admin_password", "luxe123"]
      });
    }

    // Seed Requisitions if empty
    const reqCount = await requestClient.execute("SELECT COUNT(*) as count FROM requisitions");
    if (Number(reqCount.rows[0].count) === 0) {
      for (const req of INITIAL_REQUISITIONS) {
        await requestClient.execute({
          sql: "INSERT INTO requisitions (id, department, requester, date, status, remarks, description, items, event_date, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null]
        });
      }
    }
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
};

export const getDepartmentsFromConfig = async (): Promise<Department[]> => {
  try {
    const result = await stockClient.execute("SELECT value_json FROM config WHERE key = 'system_config'");
    if (result.rows.length > 0) {
      const config = JSON.parse(String(result.rows[0].value_json));
      if (config.departments && Array.isArray(config.departments)) {
        return config.departments as Department[];
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching departments from config:", error);
    return [];
  }
};

export const getInventoryCategories = async (): Promise<string[]> => {
  try {
    const result = await stockClient.execute("SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL AND category != '' ORDER BY category ASC");
    return result.rows.map(row => String(row.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const result = await stockClient.execute("SELECT * FROM inventory");
    return result.rows
      .map(row => {
        let totalStock = 0;
        try {
          const stockData = typeof row.stock_json === 'string' 
            ? JSON.parse(row.stock_json) 
            : (row.stock_json || {});
            
          totalStock = (Object.values(stockData) as any[]).reduce((acc: number, val: any): number => acc + (Number(val) || 0), 0);
        } catch (e) {
          console.warn(`Could not parse stock_json for item ${row.id}:`, e);
        }

        return {
          id: String(row.id),
          name: String(row.name),
          category: String(row.category || 'General'),
          stock: totalStock,
          minStock: Number(row.par_stock || 0),
          unit: String(row.uom || 'Units'),
          pricePerUnit: Number(row.unit_cost || 0)
        };
      })
      .filter(item => item.stock > 0);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

export const getRequisitions = async (): Promise<Requisition[]> => {
  try {
    const result = await requestClient.execute("SELECT * FROM requisitions ORDER BY date DESC");
    return result.rows.map(row => {
      // The 'items' column might contain invalid JSON (e.g., "bought": yes instead of "bought": true).
      // This pre-processes the string to make it valid before parsing.
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
          description: String(row.description),
          items: JSON.parse(itemsJsonString),
          eventDate: row.event_date ? String(row.event_date) : undefined,
          rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined
        };
      } catch (parseError) {
        console.error(`Failed to parse items JSON for requisition ${row.id}:`, itemsJsonString, parseError);
        // Return the requisition with empty items to avoid crashing the whole app
        return {
          id: String(row.id),
          department: row.department as any,
          requester: String(row.requester),
          date: String(row.date),
          status: row.status as any,
          remarks: row.remarks as any,
          description: String(row.description),
          items: [],
          eventDate: row.event_date ? String(row.event_date) : undefined,
          rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined
        };
      }
    });
  } catch (error) {
    console.error("Error fetching requisitions:", error);
    return [];
  }
};

export const saveRequisitionDb = async (req: Requisition) => {
  await requestClient.execute({
    sql: "INSERT INTO requisitions (id, department, requester, date, status, remarks, description, items, event_date, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null]
  });
};

export const updateRequisitionDb = async (req: Requisition) => {
  await requestClient.execute({
    sql: "UPDATE requisitions SET department = ?, requester = ?, date = ?, status = ?, remarks = ?, description = ?, items = ?, event_date = ?, rejection_reason = ? WHERE id = ?",
    args: [req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.rejectionReason || null, req.id]
  });
};

export const updateStatusDb = async (id: string, status: string, reason?: string | null) => {
  if (reason !== undefined) {
    await requestClient.execute({
      sql: "UPDATE requisitions SET status = ?, rejection_reason = ? WHERE id = ?",
      args: [status, reason, id]
    });
  } else {
    await requestClient.execute({
      sql: "UPDATE requisitions SET status = ? WHERE id = ?",
      args: [status, id]
    });
  }
};

export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const result = await requestClient.execute({
      sql: "SELECT value FROM app_config WHERE key = ?",
      args: ["admin_password"]
    });
    
    if (result.rows.length > 0) {
      return String(result.rows[0].value) === password;
    }
    return password === (import.meta.env.VITE_ADMIN_PASSWORD || 'luxe123'); // Fallback
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};
