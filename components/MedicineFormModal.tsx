"use client";

import React, { useState } from "react";
import { X, Plus, Save, Pill, Package, Loader2 } from "lucide-react";
import { Drug, FacilityInventory } from "@/lib/db/schema";
import { useDashboard } from "./DashboardContext";

const STATUS_OPTIONS = ["On Track", "Delayed", "Critical Delay", "In Transit"] as const;

interface MedicineFormModalProps {
  onClose: () => void;
  facilityId: string;
  facilityName: string;
  editing: FacilityInventory | null;
  drugs: Drug[];
  existingDrugIdsAtFacility: string[];
}

export function MedicineFormModal({
  onClose,
  facilityId,
  facilityName,
  editing,
  drugs,
  existingDrugIdsAtFacility,
}: MedicineFormModalProps) {
  const { addDrugRecord, addInventoryRecord, upsertInventory } = useDashboard();

  const availableDrugs = drugs.filter((d) => !existingDrugIdsAtFacility.includes(d.id));

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [drugId, setDrugId] = useState(
    editing ? editing.drugId : availableDrugs[0]?.id || ""
  );
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("vials");
  const [newLeadTime, setNewLeadTime] = useState(7);
  const [newSafetyDays, setNewSafetyDays] = useState(10);

  const [currentStock, setCurrentStock] = useState(
    editing ? String(editing.currentStock) : "0"
  );
  const [consumption, setConsumption] = useState(
    editing ? String(editing.avgDailyConsumption) : "0"
  );
  const [safetyStock, setSafetyStock] = useState(
    editing ? String(editing.safetyStock) : ""
  );
  const [pipelineUnits, setPipelineUnits] = useState(
    editing ? String(editing.pipelineUnits) : "0"
  );
  const [nextDeliveryDays, setNextDeliveryDays] = useState(
    editing && editing.nextDeliveryDays !== null ? String(editing.nextDeliveryDays) : ""
  );
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>(
    editing
      ? (editing.replenishmentStatus as (typeof STATUS_OPTIONS)[number])
      : "On Track"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDrug = drugs.find((d) => d.id === drugId);
  const isNew = mode === "new";

  const handleSafetyStockBlur = () => {
    if (safetyStock === "" && selectedDrug) {
      setSafetyStock(String(Math.round(selectedDrug.safetyStockDays * (Number(consumption) || 0))));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const body: Record<string, unknown> = {
      facilityId,
      currentStock: Number(currentStock),
      avgDailyConsumption: Number(consumption),
      safetyStock: safetyStock === "" ? undefined : Number(safetyStock),
      pipelineUnits: Number(pipelineUnits),
      nextDeliveryDays: nextDeliveryDays === "" ? null : Number(nextDeliveryDays),
      replenishmentStatus: status,
    };

    if (editing) {
      body.id = editing.id;
      body.drugId = editing.drugId;
    } else if (isNew) {
      if (!newName.trim()) {
        setError("Medicine name is required.");
        setIsSaving(false);
        return;
      }
      body.newDrug = {
        name: newName.trim(),
        category: newCategory.trim() || "Essential Medicine",
        unit: newUnit,
        leadTimeDays: newLeadTime,
        safetyStockDays: newSafetyDays,
      };
    } else {
      if (!drugId) {
        setError("Select a medicine to add.");
        setIsSaving(false);
        return;
      }
      body.drugId = drugId;
    }

    try {
      const res = await fetch("/api/inventory", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save medicine.");
        setIsSaving(false);
        return;
      }

      if (data.drug) addDrugRecord(data.drug);
      if (editing) {
        upsertInventory(data.inventory);
      } else if (data.inventory) {
        addInventoryRecord(data.inventory);
      }
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a] text-white font-mono text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#555555] focus:ring-1 focus:ring-white/10 transition-all";
  const labelCls =
    "text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-lg bg-[#0b0b0b] border border-[#2a2a2a] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222] sticky top-0 bg-[#0b0b0b] z-10">
          <div className="flex items-center gap-2.5">
            <Pill className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white font-mono text-sm tracking-tight">
                {editing ? "Edit Medicine Stock" : "Add New Medicine"}
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                {facilityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Medicine Selection */}
          {editing ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f]">
              <Package className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-xs font-mono text-white">
                {drugs.find((d) => d.id === editing.drugId)?.name ||
                  editing.drugId}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0e0e0e] border border-[#222222] rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all ${
                    mode === "existing"
                      ? "bg-white text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Existing Medicine
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all ${
                    mode === "new"
                      ? "bg-white text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  New Medicine
                </button>
              </div>

              {mode === "existing" ? (
                <select
                  value={drugId}
                  onChange={(e) => setDrugId(e.target.value)}
                  className={inputCls}
                >
                  {availableDrugs.length === 0 && (
                    <option value="">No medicines available to add</option>
                  )}
                  {availableDrugs.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0e0e0e]">
                      {d.name} ({d.unit}) — {d.category}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2.5">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Medicine name (e.g. Paracetamol 500mg Tablet)"
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category (e.g. Analgesic)"
                      className={inputCls}
                    />
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className={inputCls}
                    >
                      <option value="vials">vials</option>
                      <option value="ampoules">ampoules</option>
                      <option value="tablets">tablets</option>
                      <option value="injections">injections</option>
                      <option value="bottles">bottles</option>
                      <option value="sachets">sachets</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="lead-time" className={labelCls}>
                        Lead Time (days)
                      </label>
                      <input
                        id="lead-time"
                        type="number"
                        min={0}
                        value={newLeadTime}
                        onChange={(e) => setNewLeadTime(Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="safety-days" className={labelCls}>
                        Safety Buffer (days)
                      </label>
                      <input
                        id="safety-days"
                        type="number"
                        min={0}
                        value={newSafetyDays}
                        onChange={(e) => setNewSafetyDays(Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="current-stock" className={labelCls}>
                Current Stock *
              </label>
              <input
                id="current-stock"
                type="number"
                min={0}
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="consumption" className={labelCls}>
                Avg Daily Consumption *
              </label>
              <input
                id="consumption"
                type="number"
                min={0}
                step="0.1"
                required
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="safety-stock" className={labelCls}>
                Safety Stock
              </label>
              <input
                id="safety-stock"
                type="number"
                min={0}
                value={safetyStock}
                onChange={(e) => setSafetyStock(e.target.value)}
                onBlur={handleSafetyStockBlur}
                placeholder={
                  selectedDrug
                    ? `auto: ${Math.round(
                        selectedDrug.safetyStockDays *
                          (Number(consumption) || 0)
                      )}`
                    : "auto"
                }
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pipeline" className={labelCls}>
                Pipeline Units
              </label>
              <input
                id="pipeline"
                type="number"
                min={0}
                value={pipelineUnits}
                onChange={(e) => setPipelineUnits(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="next-delivery" className={labelCls}>
                Next Delivery (days)
              </label>
              <input
                id="next-delivery"
                type="number"
                min={0}
                value={nextDeliveryDays}
                onChange={(e) => setNextDeliveryDays(e.target.value)}
                placeholder="blank = none"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="replenish" className={labelCls}>
                Replenishment Status
              </label>
              <select
                id="replenish"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])
                }
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#0e0e0e]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c1c1c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-neutral-300 bg-[#0e0e0e] border border-[#2a2a2a] hover:border-[#444444] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:bg-[#1f1f1f] disabled:text-neutral-500 disabled:cursor-wait"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : editing ? (
                <Save className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {editing ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}