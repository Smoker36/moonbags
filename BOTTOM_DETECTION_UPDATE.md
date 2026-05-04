# 🎯 UPDATE: Dump to BOTTOM Detection

## Strategy Sebenarnya:
```
1. Pumpfun Migration Detected
   ↓
2. Track price turun (every scan)
   ↓
3. Detect BOTTOM (lowest price point)
   ↓
4. Price start naik lagi (confirm bottom)
   ↓
🔥 FIRE - BUY DI BOTTOM!
```

---

## 📊 Perubahan di Code:

### **REPLACE** (Find & Replace di gmgnSignalSource.ts):

**Cari function ini:**
```typescript
function detectPostMigrationDump(
  candidate: Partial<GmgnSignalCandidate>,
  firstState?: { priceUsd: number; holders: number }
): {
  isDumping: boolean;
  dropPct: number;
  holderTrend: "growing" | "stable" | "declining";
}
```

**Ganti dengan:**
```typescript
function detectBottomPrice(
  candidate: Partial<GmgnSignalCandidate>,
  firstState?: { priceUsd: number; holders: number }
): {
  isAtBottom: boolean;
  currentPrice: number;
  lowestPrice: number;
  maxDropPct: number;
  isRecovering: boolean;
}
```

---

## 🔧 Implementation:

### **File:** gmgnSignalSource.ts

**STEP 1:** Find `maybeRejectTrigger` function

**STEP 2:** Find & replace this section:
```typescript
// ===== CUSTOM STRATEGY: Post-Migration Dump Detection =====
if (
  settings.filters.requirePumpfunMigration &&
  settings.filters.minPriceDropPctAfterMigration > 0
) {
```

**REPLACE dengan:**
```typescript
// ===== CUSTOM STRATEGY: Dump to Bottom Detection =====
if (settings.filters.requirePumpfunMigration) {
  const migration = detectPumpfunMigration(candidate);
  if (migration.isMigrated) {
    // Track lowest price since migration
    const firstPrice = existing?.firstPrice ?? candidate.priceUsd ?? 0;
    const currentPrice = candidate.priceUsd ?? 0;
    const lowestPrice = existing?.sourceMeta?.lowestPrice ?? firstPrice;
    
    // Update lowest price if current is lower
    const newLowestPrice = Math.min(lowestPrice, currentPrice);
    
    // Check if price is at bottom (below lowest by small margin, then starting to recover)
    const maxDropPct = ((firstPrice - newLowestPrice) / firstPrice) * 100;
    const isRecovering = currentPrice > newLowestPrice * 1.02; // 2% above lowest = sign of recovery
    const isAtBottom = newLowestPrice > 0 && maxDropPct > 10 && isRecovering; // Min 10% dump + signs of recovery
    
    if (isAtBottom) {
      candidate.sourceMeta = {
        ...candidate.sourceMeta,
        bottomDetection: {
          isAtBottom: true,
          currentPrice,
          lowestPrice: newLowestPrice,
          maxDropPct: Math.round(maxDropPct * 100) / 100,
          isRecovering,
        },
      };
    } else {
      // Still dumping or waiting for recovery
      return `dumping to bottom... current: $${currentPrice.toFixed(6)}, lowest: $${newLowestPrice.toFixed(6)}, drop: ${maxDropPct.toFixed(1)}%`;
    }
  }
}
```

---

## ⚙️ Settings Update:

**REMOVE** ini dari settings.json:
```json
"minPriceDropPctAfterMigration": 15,
```

**GUNAKAN default filter existing** - tidak perlu tambah filter baru.

---

## 📝 Settings.json Final:

```json
{
  "signals": {
    "gmgn": {
      "filters": {
        "minVolumeMcapRatio": 10,
        "requirePumpfunMigration": true
      },
      "trigger": {
        "minScans": 4,
        "comment": "Tunggu 5 scans untuk confirm price stabilize at bottom"
      }
    }
  }
}
```

---

## 🔍 How It Works:

```
Token: Pumpfun Migrated
Price: $0.00050

Scan 1: Price = $0.00050 (migration price, tracking...)
Scan 2: Price = $0.00045 (dumping 10%)
Scan 3: Price = $0.00040 (dumping 20%)
Scan 4: Price = $0.00038 (BOTTOM, lowest point)
Scan 5: Price = $0.00039 (recovering from bottom +2%)
  ↓
✅ DETECTED: AT BOTTOM!
  ↓
🔥 FIRE ALERT - BUY AT BOTTOM!
```

---

## 🎯 Key Points:

- ✅ Track lowest price sejak migration
- ✅ Detect ketika price mulai recovery (2% above lowest)
- ✅ Minimum 10% dump to qualify as "bottom"
- ✅ Minimum 5 scans untuk confirm stabilized

---

**Lebih simple & lepat!** Implementasi?
