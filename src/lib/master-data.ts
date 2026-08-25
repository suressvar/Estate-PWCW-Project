export interface PlotItem {
  id: string;
  name: string;
  location: string;
  areaAcres: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface CropItem {
  id: string;
  name: string;
  type: "CROP" | "ACTIVITY";
  createdAt: string;
}

export interface PlotCropAssociation {
  id: string;
  plotId: string;
  plotName: string;
  cropActivityId: string;
  cropActivityName: string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "COMPLETED";
}

// Initial In-Memory Store for Master Data Management
let mockPlots: PlotItem[] = [
  { id: "p1", name: "Plot A - North Field", location: "North Sector", areaAcres: 12.5, status: "ACTIVE", createdAt: "2026-01-10" },
  { id: "p2", name: "Plot B - Coconut Grove", location: "East Sector", areaAcres: 8.0, status: "ACTIVE", createdAt: "2026-01-12" },
  { id: "p3", name: "Plot C - South Pasture", location: "South Sector", areaAcres: 15.2, status: "INACTIVE", createdAt: "2026-02-01" },
];

let mockCrops: CropItem[] = [
  { id: "c1", name: "Tomato", type: "CROP", createdAt: "2026-01-05" },
  { id: "c2", name: "Coconut", type: "CROP", createdAt: "2026-01-05" },
  { id: "c3", name: "Fertilizer Application", type: "ACTIVITY", createdAt: "2026-01-15" },
  { id: "c4", name: "Weeding & Tying", type: "ACTIVITY", createdAt: "2026-01-20" },
];

let mockPlotCrops: PlotCropAssociation[] = [
  { id: "pc1", plotId: "p1", plotName: "Plot A - North Field", cropActivityId: "c1", cropActivityName: "Tomato", startDate: "2026-06-01", status: "ACTIVE" },
  { id: "pc2", plotId: "p1", plotName: "Plot A - North Field", cropActivityId: "c3", cropActivityName: "Fertilizer Application", startDate: "2026-06-15", status: "ACTIVE" },
  { id: "pc3", plotId: "p2", plotName: "Plot B - Coconut Grove", cropActivityId: "c2", cropActivityName: "Coconut", startDate: "2026-01-01", status: "ACTIVE" },
];

export function getPlots() {
  return mockPlots;
}

export function createPlot(data: Omit<PlotItem, "id" | "createdAt">) {
  const newPlot: PlotItem = {
    ...data,
    id: `p_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockPlots.unshift(newPlot);
  return newPlot;
}

export function updatePlot(id: string, data: Partial<PlotItem>) {
  mockPlots = mockPlots.map((p) => (p.id === id ? { ...p, ...data } : p));
  return mockPlots.find((p) => p.id === id);
}

export function deletePlot(id: string) {
  mockPlots = mockPlots.filter((p) => p.id !== id);
  mockPlotCrops = mockPlotCrops.filter((pc) => pc.plotId !== id);
}

export function getCrops() {
  return mockCrops;
}

export function createCrop(data: Omit<CropItem, "id" | "createdAt">) {
  const newCrop: CropItem = {
    ...data,
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockCrops.unshift(newCrop);
  return newCrop;
}

export function updateCrop(id: string, data: Partial<CropItem>) {
  mockCrops = mockCrops.map((c) => (c.id === id ? { ...c, ...data } : c));
  return mockCrops.find((c) => c.id === id);
}

export function deleteCrop(id: string) {
  mockCrops = mockCrops.filter((c) => c.id !== id);
  mockPlotCrops = mockPlotCrops.filter((pc) => pc.cropActivityId !== id);
}

export function getPlotCrops() {
  return mockPlotCrops;
}

export function createPlotCrop(plotId: string, cropActivityId: string, startDate: string) {
  const results = createPlotCrops(plotId, [cropActivityId], startDate);
  return results[0] || null;
}

export function createPlotCrops(plotId: string, cropActivityIds: string[], startDate: string) {
  const plot = mockPlots.find((p) => p.id === plotId);
  const plotName = plot ? plot.name : "Unknown Plot";
  const created: PlotCropAssociation[] = [];

  cropActivityIds.forEach((cropActivityId, index) => {
    // Check if active association already exists for this plot and crop
    const existingActive = mockPlotCrops.find(
      (pc) => pc.plotId === plotId && pc.cropActivityId === cropActivityId && pc.status === "ACTIVE"
    );

    if (existingActive) {
      // Return existing active association or skip duplicate
      created.push(existingActive);
      return;
    }

    const crop = mockCrops.find((c) => c.id === cropActivityId);
    const newAssoc: PlotCropAssociation = {
      id: `pc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      plotId,
      plotName,
      cropActivityId,
      cropActivityName: crop ? crop.name : "Unknown Crop",
      startDate: startDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    };

    mockPlotCrops.unshift(newAssoc);
    created.push(newAssoc);
  });

  return created;
}

export function updatePlotCropStatus(id: string, status: "ACTIVE" | "COMPLETED") {
  mockPlotCrops = mockPlotCrops.map((pc) => (pc.id === id ? { ...pc, status } : pc));
}

export function deletePlotCrop(id: string) {
  mockPlotCrops = mockPlotCrops.filter((pc) => pc.id !== id);
}

