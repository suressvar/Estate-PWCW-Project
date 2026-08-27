import { getDatabase, saveDatabase, PlotItem, CropItem, PlotCropAssociation } from "./db-storage";

export type { PlotItem, CropItem, PlotCropAssociation };

export function getPlots(): PlotItem[] {
  return getDatabase().plots;
}

export function createPlot(data: Omit<PlotItem, "id" | "createdAt">): PlotItem {
  const db = getDatabase();
  const newPlot: PlotItem = {
    ...data,
    id: `p_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.plots.unshift(newPlot);
  saveDatabase(db);
  return newPlot;
}

export function updatePlot(id: string, data: Partial<PlotItem>): PlotItem | undefined {
  const db = getDatabase();
  db.plots = db.plots.map((p) => (p.id === id ? { ...p, ...data } : p));
  saveDatabase(db);
  return db.plots.find((p) => p.id === id);
}

export function deletePlot(id: string) {
  const db = getDatabase();
  db.plots = db.plots.filter((p) => p.id !== id);
  db.plotCrops = db.plotCrops.filter((pc) => pc.plotId !== id);
  saveDatabase(db);
}

export function getCropCategories(): string[] {
  const db = getDatabase();
  if (!db.cropCategories || !Array.isArray(db.cropCategories) || db.cropCategories.length === 0) {
    db.cropCategories = ["CROP", "ACTIVITY", "FRUIT CROPS", "VEGETABLES", "TIMBER & TREES", "FODDER CROPS", "INTER-CROP", "FIELD ACTIVITY", "IRRIGATION & WATER", "SOIL & FERTILIZATION"];
    saveDatabase(db);
  }
  return db.cropCategories;
}

export function createCropCategory(category: string): string {
  const trimmed = category.trim().toUpperCase();
  if (!trimmed) return "";
  const db = getDatabase();
  if (!db.cropCategories) {
    db.cropCategories = [];
  }
  if (!db.cropCategories.includes(trimmed)) {
    db.cropCategories.push(trimmed);
    saveDatabase(db);
  }
  return trimmed;
}

export function deleteCropCategory(category: string) {
  const db = getDatabase();
  if (db.cropCategories) {
    db.cropCategories = db.cropCategories.filter((c) => c !== category);
    saveDatabase(db);
  }
}

export function getCrops(): CropItem[] {
  return getDatabase().crops;
}

export function createCrop(data: Omit<CropItem, "id" | "createdAt">): CropItem {
  const db = getDatabase();
  const categoryType = data.type ? data.type.trim().toUpperCase() : "CROP";
  
  if (categoryType && db.cropCategories && !db.cropCategories.includes(categoryType)) {
    db.cropCategories.push(categoryType);
  }

  const newCrop: CropItem = {
    name: data.name,
    type: categoryType,
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.crops.unshift(newCrop);
  saveDatabase(db);
  return newCrop;
}

export function updateCrop(id: string, data: Partial<CropItem>): CropItem | undefined {
  const db = getDatabase();
  const categoryType = data.type ? data.type.trim().toUpperCase() : undefined;

  if (categoryType && db.cropCategories && !db.cropCategories.includes(categoryType)) {
    db.cropCategories.push(categoryType);
  }

  db.crops = db.crops.map((c) => (c.id === id ? { ...c, ...data, ...(categoryType ? { type: categoryType } : {}) } : c));
  saveDatabase(db);
  return db.crops.find((c) => c.id === id);
}

export function deleteCrop(id: string) {
  const db = getDatabase();
  db.crops = db.crops.filter((c) => c.id !== id);
  db.plotCrops = db.plotCrops.filter((pc) => pc.cropActivityId !== id);
  saveDatabase(db);
}

export function getPlotCrops(): PlotCropAssociation[] {
  return getDatabase().plotCrops;
}

export function createPlotCrop(plotId: string, cropActivityId: string, startDate: string) {
  const results = createPlotCrops(plotId, [cropActivityId], startDate);
  return results[0] || null;
}

export function createPlotCrops(plotId: string, cropActivityIds: string[], startDate: string) {
  const db = getDatabase();
  const plot = db.plots.find((p) => p.id === plotId || p.name === plotId);
  const plotName = plot ? plot.name : "Unknown Plot";
  const actualPlotId = plot ? plot.id : plotId;
  const created: PlotCropAssociation[] = [];

  cropActivityIds.forEach((cropActivityId, index) => {
    const crop = db.crops.find((c) => c.id === cropActivityId || c.name === cropActivityId);
    const actualCropId = crop ? crop.id : cropActivityId;
    const cropName = crop ? crop.name : "Unknown Crop";

    const existingActive = db.plotCrops.find(
      (pc) => (pc.plotId === actualPlotId || pc.plotId === plotId) && (pc.cropActivityId === actualCropId || pc.cropActivityId === cropActivityId) && pc.status === "ACTIVE"
    );

    if (existingActive) {
      created.push(existingActive);
      return;
    }

    const newAssoc: PlotCropAssociation = {
      id: `pc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      plotId: actualPlotId,
      plotName,
      cropActivityId: actualCropId,
      cropActivityName: cropName,
      startDate: startDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    };

    db.plotCrops.unshift(newAssoc);
    created.push(newAssoc);
  });

  saveDatabase(db);
  return created;
}

export function updatePlotCropStatus(id: string, status: "ACTIVE" | "COMPLETED") {
  const db = getDatabase();
  db.plotCrops = db.plotCrops.map((pc) => (pc.id === id ? { ...pc, status } : pc));
  saveDatabase(db);
}

export function deletePlotCrop(id: string) {
  const db = getDatabase();
  db.plotCrops = db.plotCrops.filter((pc) => pc.id !== id);
  saveDatabase(db);
}

export function resetMasterData() {
  const db = getDatabase();
  db.plots = [];
  db.crops = [];
  db.plotCrops = [];
  saveDatabase(db);
}
