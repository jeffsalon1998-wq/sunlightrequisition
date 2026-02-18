
import { createClient } from "@libsql/client";
import { InventoryItem, Requisition, Department } from "../types";
import { INITIAL_REQUISITIONS } from "../constants";

// 1. Stock Registry Database (Read-only for this app)
const STOCK_URL = "libsql://database-red-tree-vercel-icfg-tf7wnf43zngjwvbur4t9rp6n.aws-us-east-1.turso.io";
const STOCK_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA4ODM2NDEsImlkIjoiZGUyZjlkZTgtOTEzYS00YzE1LThlMzMtMzhlYTMzMGFkNzI5IiwicmlkIjoiYzNhZDBiYmMtNTI0My00NTc2LTkwYzQtYjNjZDdmZGU1ZmM3In0.8gOpqGrKkuO5LTP8PvBWZJjMskckorIyyPedTVeIZHSXqCtebkp2AQvl-2VPRZchEtizL8MJxQTZR2Da4tj4CQ";

// 2. Requisitions Database (Read/Write)
const REQ_URL = "libsql://prrequest-vercel-icfg-tf7wnf43zngjwvbur4t9rp6n.aws-us-east-1.turso.io";
const REQ_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzEwNjA0NDEsImlkIjoiNTEyODlkNzQtYzhjNi00YzllLTg2YjYtNjk1MTZlY2ZjNDgzIiwicmlkIjoiMzQyNmUyODUtYjhlNS00OWI2LWE0ZDktNDFmZTQ3MzE0ZjNjIn0.rqlTsVVTqoMowmh-2XO9pptsb77qdThUvOvyH95KNsTkCUaOKiO2DwHMnl72qET3ORXfFyHjELmyTu4rLMKuDA";

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
        event_date TEXT
      )
    `);
    
    // Attempt to add event_date column if it doesn't exist (migration for existing databases)
    try {
      await requestClient.execute("ALTER TABLE requisitions ADD COLUMN event_date TEXT");
    } catch (e) {
      // Column likely already exists, safe to ignore
    }

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
          sql: "INSERT INTO requisitions (id, department, requester, date, status, remarks, description, items, event_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null]
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
    return result.rows.map(row => ({
      id: String(row.id),
      department: row.department as any,
      requester: String(row.requester),
      date: String(row.date),
      status: row.status as any,
      remarks: row.remarks as any,
      description: String(row.description),
      items: JSON.parse(String(row.items)),
      eventDate: row.event_date ? String(row.event_date) : undefined
    }));
  } catch (error) {
    console.error("Error fetching requisitions:", error);
    return [];
  }
};

export const saveRequisitionDb = async (req: Requisition) => {
  await requestClient.execute({
    sql: "INSERT INTO requisitions (id, department, requester, date, status, remarks, description, items, event_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [req.id, req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null]
  });
};

export const updateRequisitionDb = async (req: Requisition) => {
  await requestClient.execute({
    sql: "UPDATE requisitions SET department = ?, requester = ?, date = ?, status = ?, remarks = ?, description = ?, items = ?, event_date = ? WHERE id = ?",
    args: [req.department, req.requester, req.date, req.status, req.remarks, req.description || "", JSON.stringify(req.items), req.eventDate || null, req.id]
  });
};

export const updateStatusDb = async (id: string, status: string) => {
  await requestClient.execute({
    sql: "UPDATE requisitions SET status = ? WHERE id = ?",
    args: [status, id]
  });
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
    return password === 'luxe123'; // Fallback
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};
