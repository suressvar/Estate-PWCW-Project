import type { EstateDatabase } from './db-storage';
import { ValidationError } from './validation';

export function reversePurchaseStock(db: EstateDatabase, sourceId: string) {
  const linked = (db.godownItems || []).filter(item => item.sourceVoucherId === sourceId);
  if (linked.some(item => item.availableQuantity < item.totalReceivedQuantity)) throw new ValidationError('This purchase has issued stock. Record a reversal before deleting it.');
  const ids = new Set(linked.map(item => item.id));
  db.godownItems = (db.godownItems || []).filter(item => !ids.has(item.id));
  db.godownMovements = (db.godownMovements || []).filter(movement => !ids.has(movement.godownItemId));
}
