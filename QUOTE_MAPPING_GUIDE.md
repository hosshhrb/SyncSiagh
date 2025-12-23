# CRM Quote to Siagh Pre-Invoice - Data Mapping Guide

## Overview
This document shows how CRM Quote data is mapped to Siagh Finance pre-invoice format.

---

## 1. CRM Quote Example (What We Receive from Webhook)

```json
{
  "crmId": "265d2327-64bd-4ac5-9fb9-22ae0e838539",
  "crmObjectTypeCode": "PI_5",  // ⭐ IMPORTANT: Extract "5" for codesalemodel
  "identityId": "8adeeabc-fab9-4a77-a906-e47ac59373a7",
  "subject": "Test Organization - Pre-Invoice",
  "description": "Quote for products",

  "totalValue": 100000.00,
  "vat": 9000.00,
  "toll": 0.00,
  "discount": 0.00,
  "finalValue": 109000.00,
  "vatPercent": 9,

  "creatDate": "2025-12-21T14:06:17.173",
  "modifyDate": "2025-12-21T14:10:20.033",

  "details": [
    {
      "productCode": "Product-1",
      "productId": "46da9490-ee92-42df-ba61-64d62b4da6b9",
      "productName": "محصول اول",
      "productUnitTypeName": "قطعه",
      "count": 1.0000,
      "baseUnitPrice": 100000.00,
      "finalUnitPrice": 109000.00,
      "totalDiscount": 0.00,
      "totalVat": 9000.00
    }
  ]
}
```

---

## 2. Siagh Pre-Invoice Format (What We Send to Siagh)

### API Endpoint
```
POST http://siagh-server/BpmsApi/SaveFormData
```

### Request Body Structure
```json
{
  "formId": "43D81",
  "ctrlValues": "sl_sanad.hssanadstate=8|sl_sanad.codenoeesanad=2|sl_sanad.codesalemodel=5|...",
  "dataRows": "[{...}]",
  "uuid": "generated-uuid",
  "CodeMain": "",
  "sessionId": "session-token"
}
```

---

## 3. Field-by-Field Mapping

### A. Header Fields (Main Invoice Data)

| CRM Quote Field | Siagh Field | Mapping Logic | Example |
|----------------|-------------|---------------|---------|
| `crmObjectTypeCode` | `codesalemodel` | Extract number from "PI_X" pattern | "PI_5" → "5" |
| `identityId` | `codemoshtari` | Lookup from EntityMapping table | "8adeeabc..." → "1234" |
| `description` or `subject` | `tozihat` | Direct copy | "Quote for products" |
| `crmObjectTypeCode` | `namenoesanad` | Formatted name | "پیش فاکتور فروش PI_5" |
| Current year - 621 | `salmali` | Convert Gregorian to Persian | 2025 → 1404 |
| Fixed: "2" | `codenoeesanad` | Document type (pre-invoice) | "2" |
| Fixed: "2" | `codenoeepardakht` | Payment type (check) | "2" |
| Fixed: "1" | `codenoeeforush` | Sale type | "1" |
| Fixed: "" | `codemarkazforush` | Sales center (default) | "" |
| Fixed: "" | `codecontact` | Contact code (optional) | "" |
| Fixed: "" | `codevaseteh` | Intermediary (optional) | "" |

### B. Line Items (Quote Details → Invoice Items)

| CRM Quote Detail Field | Siagh Item Field | Mapping Logic | Example |
|----------------------|------------------|---------------|---------|
| `productCode` | `codekala` | Direct copy (or productId if missing) | "Product-1" |
| `productUnitTypeName` | `nameunit` | Direct copy (default: "عدد") | "قطعه" |
| `count` | `qty` | Direct copy | 1.0000 |
| `baseUnitPrice` | `price` | Direct copy (before VAT) | 100000.00 |
| `totalDiscount` | `mabtakhfif` | Direct copy | 0.00 |
| Index + 1 | `radif` | Row number | "1", "2", "3"... |
| Fixed: "0" | `vazn` | Weight (not used) | "0" |
| Fixed: "0" | `hajm` | Volume (not used) | "0" |

---

## 4. Complete Transformation Example

### Input: CRM Quote
```json
{
  "crmObjectTypeCode": "PI_5",
  "identityId": "8adeeabc-fab9-4a77-a906-e47ac59373a7",
  "description": "Test quote",
  "details": [
    {
      "productCode": "Product-1",
      "productUnitTypeName": "قطعه",
      "count": 2,
      "baseUnitPrice": 50000,
      "totalDiscount": 1000
    }
  ]
}
```

### Step 1: Extract Sale Model Code
```typescript
crmObjectTypeCode = "PI_5"
→ Extract with regex: /PI_(\d+)/
→ codesalemodel = "5"
```

### Step 2: Lookup Customer
```typescript
identityId = "8adeeabc-fab9-4a77-a906-e47ac59373a7"
→ Query EntityMapping table
→ codemoshtari = "1234" (Siagh customer code)
```

### Step 3: Build Siagh Request
```typescript
{
  codenoeesanad: "2",           // Pre-invoice sales
  codesalemodel: "5",           // ⭐ From PI_5
  salmali: 1404,                // 2025 - 621
  codenoeepardakht: "2",        // Check payment
  codemoshtari: "1234",         // Customer code
  tozihat: "Test quote",
  namenoesanad: "پیش فاکتور فروش PI_5",
  items: [
    {
      codekala: "Product-1",
      nameunit: "قطعه",
      qty: 2,
      price: 50000,
      mabtakhfif: 1000,
      vazn: "0",
      hajm: "0",
      radif: "1"
    }
  ]
}
```

### Step 4: Convert to Siagh API Format
```json
{
  "formId": "43D81",
  "ctrlValues": "sl_sanad.hssanadstate=8|sl_sanad.codenoeesanad=2|sl_sanad.codesalemodel=5|sl_sanad.salmali=1404|sl_sanad.codenoeepardakht=2|sl_sanad.codemoshtari=1234|sl_sanad.tozihat=Test quote|sl_sanad.namenoesanad=پیش فاکتور فروش PI_5",
  "dataRows": "[{\"name\":\"dbgrid1\",\"entity\":\"sl_rizsanad\",\"keyField\":\"coderiz\",\"data\":[{\"codekala\":{\"newValue\":\"Product-1\"},\"qty\":{\"newValue\":2},\"price\":{\"newValue\":50000},\"mabtakhfif\":{\"newValue\":1000}}]}]",
  "uuid": "generated-uuid-here",
  "CodeMain": "",
  "sessionId": "session-token-here"
}
```

---

## 5. Code Reference

### Extract Sale Model Code
**File:** `src/sync/orchestrator/crm-quote-to-siagh.service.ts:181-202`

```typescript
private extractSaleModelCode(crmObjectTypeCode: string): string {
  if (!crmObjectTypeCode) return '1';

  // Extract number from "PI_X" pattern
  const match = crmObjectTypeCode.match(/PI_(\d+)/);
  if (match && match[1]) {
    return match[1];  // "PI_5" → "5"
  }

  // Fallback: extract any number
  const numberMatch = crmObjectTypeCode.match(/\d+/);
  if (numberMatch) return numberMatch[0];

  return '1'; // Default
}
```

### Transform to Siagh
**File:** `src/sync/orchestrator/crm-quote-to-siagh.service.ts:207-242`

```typescript
private transformCrmToSiagh(
  crmQuote: CrmQuoteDto,
  siaghCustomerCode: string,
  codesalemodel: string,
): CreateSiaghPreInvoiceRequest {
  // Convert year
  const currentYear = new Date().getFullYear();
  const fiscalYear = currentYear > 2000 ? currentYear - 621 : 1404;

  // Map items
  const items = crmQuote.details.map((item, index) => ({
    codekala: item.productCode || item.productId,
    nameunit: item.productUnitTypeName || 'عدد',
    qty: item.count,
    price: item.baseUnitPrice,
    mabtakhfif: item.totalDiscount || 0,
    vazn: '0',
    hajm: '0',
    radif: String(index + 1),
  }));

  return {
    codenoeesanad: '2',
    codesalemodel: codesalemodel,  // ⭐ Extracted value
    salmali: fiscalYear,
    codenoeepardakht: '2',
    codemoshtari: siaghCustomerCode,
    codenoeeforush: '1',
    tozihat: crmQuote.description || crmQuote.subject || '',
    namenoesanad: `پیش فاکتور فروش ${crmQuote.crmObjectTypeCode}`.trim(),
    items,
  };
}
```

### Create Pre-Invoice in Siagh
**File:** `src/finance/siagh-api.client.ts:311-400`

```typescript
async createPreInvoice(data: CreateSiaghPreInvoiceRequest): Promise<string> {
  const sessionId = await this.ensureSession();

  // Build ctrlValues pipe-separated string
  const ctrlValues = [
    'sl_sanad.hssanadstate=8',
    `sl_sanad.codenoeesanad=${data.codenoeesanad ?? '2'}`,
    `sl_sanad.codesalemodel=${data.codesalemodel ?? '1'}`,  // ⭐ Here!
    `sl_sanad.salmali=${data.salmali ?? 1404}`,
    `sl_sanad.codenoeepardakht=${data.codenoeepardakht ?? '2'}`,
    `sl_sanad.codemoshtari=${data.codemoshtari}`,
    `sl_sanad.tozihat=${data.tozihat ?? ''}`,
    `sl_sanad.namenoesanad=${data.namenoesanad ?? ''}`,
  ].join('|');

  // Build dataRows for line items
  const dataRows = JSON.stringify([{
    name: 'dbgrid1',
    entity: 'sl_rizsanad',
    keyField: 'coderiz',
    data: data.items.map((item, index) => ({
      __uid: { oldValue: `item-${index}`, newValue: `item-${index}` },
      codekala: { oldValue: '', newValue: item.codekala },
      qty: { oldValue: '', newValue: item.qty },
      price: { oldValue: '', newValue: item.price },
      mabtakhfif: { oldValue: '', newValue: item.mabtakhfif || 0 },
      // ... other fields
    }))
  }]);

  // Send to Siagh
  const response = await this.request('POST', '/BpmsApi/SaveFormData', {
    formId: '43D81',
    ctrlValues,
    dataRows,
    uuid: uuidv4(),
    CodeMain: '',
    sessionId,
  });

  return invoiceNumber; // Extracted from response
}
```

---

## 6. Key Points

### 🔑 Most Important Mapping
```
CRM: crmObjectTypeCode = "PI_5"
  ↓ (Extract number using regex)
Siagh: codesalemodel = "5"
```

### 📋 Customer Mapping Required
Before syncing a quote, the customer MUST be synced first:
```
CRM: identityId = "8adeeabc-fab9-4a77-a906-e47ac59373a7"
  ↓ (Lookup in EntityMapping table)
Siagh: codemoshtari = "1234"
```

### 📅 Year Conversion
```
Gregorian: 2025
  ↓ (Subtract 621)
Persian: 1404
```

### 💰 Price Calculation
- Use `baseUnitPrice` (before VAT), not `finalUnitPrice`
- Siagh calculates VAT automatically based on settings
- Discount is per item (`totalDiscount` field)

---

## 7. Testing the Mapping

To test the quote sync:

1. **Ensure customer exists in Siagh**
   ```bash
   # Check EntityMapping for customer
   SELECT * FROM entity_mapping
   WHERE entity_type = 'CUSTOMER'
   AND crm_id = '8adeeabc-fab9-4a77-a906-e47ac59373a7';
   ```

2. **Trigger webhook from CRM**
   - Create/update a quote in CRM
   - Check logs for mapping details

3. **Verify in Siagh**
   - Check that `codesalemodel` matches the extracted number
   - Verify customer code is correct
   - Check line items are properly mapped

---

## 8. Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Customer not found | Quote references customer not synced | Sync customer first |
| Wrong sale model | crmObjectTypeCode format changed | Check regex pattern |
| Missing product code | Product not in CRM catalog | Use productId as fallback |
| Year mismatch | Wrong fiscal year | Check year conversion logic |

---

## Generated: 2025-12-21
## Version: 1.0
