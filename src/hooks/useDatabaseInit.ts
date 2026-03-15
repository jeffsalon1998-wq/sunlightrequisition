import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Requisition, Department } from '../../types';
import { 
  initDatabase, 
  getInventory, 
  getRequisitions, 
  getDepartmentsFromConfig 
} from '../../services/database';
import { DEPARTMENTS } from '../../constants';

export function useDatabaseInit() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([...DEPARTMENTS]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      await initDatabase();
      const [invData, reqData, deptData] = await Promise.all([
        getInventory(),
        getRequisitions(),
        getDepartmentsFromConfig()
      ]);
      setInventory(invData);
      setRequisitions(reqData);
      if (deptData && deptData.length > 0) {
        setAvailableDepartments(deptData);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      if (!silent) setError(err instanceof Error ? err : new Error('Failed to initialize database'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return { 
    inventory, 
    setInventory, 
    requisitions, 
    setRequisitions, 
    availableDepartments, 
    setAvailableDepartments, 
    isLoading, 
    error,
    refresh: loadData
  };
}
