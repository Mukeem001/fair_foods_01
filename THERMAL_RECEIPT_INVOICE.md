# Professional Thermal Receipt Invoice Component
## Fair Foods Admin Panel - Production Ready

---

## 📋 Overview

A fully responsive, production-ready thermal receipt invoice component optimized for **80mm (3-inch) thermal printers**. Perfect for food delivery, restaurants, and e-commerce applications.

### Key Features
✅ **Optimized for 80mm thermal printers** - Standard width (42 characters)  
✅ **Black & White compatible** - No colors or gradients  
✅ **Compact design** - Minimized paper usage  
✅ **Mobile responsive** - Works on all devices  
✅ **Professional layout** - Restaurant-grade billing format  
✅ **Automatic text wrapping** - Smart address & item name handling  
✅ **Complete billing support** - Subtotal, delivery, discount, tax, grand total  
✅ **Print-optimized CSS** - Perfect print output directly from browser  

---

## 📄 Receipt Layout & Content

### Header
- **Restaurant Name**: ★ FAIR FOODS ★ (with decorative stars)
- **Tagline**: FOOD DELIVERY
- **Border**: Top and bottom separators

### Invoice Information
- **Invoice Number**: FF-XXXXXX format
- **Order ID**: Full order ID reference
- **Date**: DD MMM YYYY format
- **Time**: HH:MM 24-hour format

### Customer Information
- **Customer Name**: Full name
- **Mobile Number**: Contact phone
- **Delivery Address**: Auto-wrapped to 2 lines max (40 chars per line)

### Items Section
For each order item:
- **Item Name**: Auto-truncated to 30 characters
- **Quantity × Price**: Right-aligned format (e.g., "2x ₹250")
- **Line Total**: Right-aligned with proper spacing

### Billing Summary
- **Subtotal**: Displayed if > 0
- **Delivery Charge**: Displayed if > 0
- **Discount**: Displayed if > 0 (negative sign)
- **Tax**: Displayed if > 0
- **Grand Total**: Bold, 11px font size, clearly visible

### Order Details
- **Status**: Order status (PENDING, COMPLETED, etc.)
- **Payment Method**: Payment type (Online, Cash, etc.)
- **Paid Status**: Payment status confirmation

### Footer
- **Thank You Message**
- **Visit Again text**
- **Generation timestamp** (optional, 7px font)

---

## 🖨️ Technical Specifications

### Dimensions
- **Width**: 80mm (3 inches) - Standard thermal printer width
- **Height**: Auto-adjustable based on content
- **Character Width**: ~42 characters at standard thermal printer settings (12 CPI)

### Typography
- **Font Family**: Courier New, monospace (for thermal printer compatibility)
- **Base Font Size**: 10px
- **Line Height**: 1.25 (compact, suitable for thermal printing)
- **Font Weights**: Regular (400), Bold (700)

### Color Scheme
- **Text Color**: Pure black (#000)
- **Background**: Pure white (#fff)
- **Borders**: Solid black lines only
- **No gradients, shadows, or colors**

### Layout Grid
```
42 Characters Wide
═══════════════════════════════════════════
Header (centered)
═══════════════════════════════════════════
Invoice Info (left-right format)
────────────────────────────────────────────
Customer Details (left-aligned, wrapped)
═══════════════════════════════════════════
Items (item name + qty/price details)
═══════════════════════════════════════════
Billing Section (boxed with borders)
═══════════════════════════════════════════
Order Details
─────────────────────────────────────────
Footer (centered)
```

---

## 💻 Implementation Details

### File Location
```
fairfoods-admin/artifacts/admin-panel/src/pages/orders.tsx
Function: handlePrintOrder()
Line: 91-240 (approximately)
```

### Data Mapping
```javascript
{
  // Customer Info
  user: {
    fullName: string,
    phone: string,
    address: string
  },
  
  // Order Info
  id: string/number,
  createdAt: ISO 8601 timestamp,
  status: 'pending' | 'completed' | 'cancelled' | string,
  
  // Items
  items: [
    {
      name: string,
      qty: number,
      price: number,
      quantity: number (alias)
    }
  ],
  
  // Billing
  subtotal: number,
  total: number,
  deliveryCharge: number (optional),
  discount: number (optional),
  tax: number (optional),
  
  // Payment
  paymentMethod: string,
  paymentStatus: string
}
```

### Helper Functions

#### `wrapAddress(addr: string, maxChars: number = 40, maxLines: number = 2)`
Automatically wraps address to maximum 2 lines, ~40 characters per line.

#### `leftRightFormat(left: string, right: string)`
Formats text with left alignment and right alignment on same line using spaces for proper thermal printer alignment.

#### `centerText(text: string)`
Centers text within 42-character width for thermal printer format.

---

## 🎨 CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `.receipt-container` | Main wrapper (80mm width) |
| `.header` | Logo and tagline section |
| `.header-logo` | Restaurant name with stars |
| `.section` | Content section with margins |
| `.divider-line` | Solid separator line |
| `.dashed-divider` | Dashed separator line |
| `.row-compact` | Compact text row |
| `.item-row` | Single item entry |
| `.item-name` | Item name with text wrapping |
| `.item-details` | Item qty/price details |
| `.total-section` | Billing summary box |
| `.grand-total` | Grand total (bold, 11px) |
| `.footer` | Footer section with dashed top |

---

## 🚀 Usage & Testing

### Opening Print Preview
1. Click **Print** button on order page
2. Browser's print dialog opens
3. Select printer settings:
   - Paper size: Custom 80mm width or Thermal
   - Margins: 0 (minimum)
   - Headers/Footers: Off
   - Background Graphics: On

### Browser Print Settings
```
❌ Headers and Footers
❌ Background Graphics (can be ON for black borders)
✅ Margins: None/0
✅ Paper Size: Custom (80mm width) or Thermal 3"
✅ Scaling: 100% (no scaling)
```

### Testing Checklist
- [x] Text alignment on thermal printer (42-char width)
- [x] Item names wrap if too long
- [x] Address wraps to max 2 lines
- [x] Grand total is bold and visible
- [x] No color bleeding (B&W only)
- [x] Proper character spacing for monospace
- [x] Print margins are minimal
- [x] All content fits on standard thermal paper

---

## 📐 Sample Receipt Output

```
       ★ FAIR FOODS ★
      FOOD DELIVERY
==========================================
Inv: FF-ABC123        24 Jun 2026 10:30 AM
Order: #12345
──────────────────────────────────────────
Rajesh Kumar
+91-98765-43210
123 Main Street, Apt 5A
==========================================
Biryani (Chicken)
2x ₹250                          ₹500
Butter Chicken Curry
1x ₹300                          ₹300
Garlic Naan
2x ₹60                           ₹120
==========================================
Subtotal                         ₹920
Delivery                         ₹50
Discount                        -₹50
Tax                              ₹60
TOTAL                           ₹980
==========================================
Status: COMPLETED
Payment: Online
Paid: Completed
──────────────────────────────────────────
        Thank You!
      Please Visit Again
Generated: 24 Jun 2026 10:30:45 AM
```

---

## 🔧 Configuration Options

### Font Size Adjustments
```javascript
// Header logo
font-size: 11px → Adjust for prominence

// Item details
font-size: 9px → Adjust for readability

// Grand total
font-size: 11px → Must be bold and visible

// Footer
font-size: 8px → Small but readable
```

### Text Length Limits
```javascript
itemName: substring(0, 30) // Item name max 30 chars
address: wrapAddress(..., 40, 2) // Max 40 chars, 2 lines
lineWidth: 42 // Standard thermal printer width
```

### Spacing Controls
```css
padding: 5px  /* Receipt padding */
margin: 1px   /* Inter-element spacing */
line-height: 1.25  /* Compact vertical spacing */
```

---

## 🐛 Troubleshooting

### Issue: Text is cut off or wrapping incorrectly
**Solution**: Verify `lineWidth = 42` matches your printer settings and font is Courier New

### Issue: Address shows on multiple lines unexpectedly
**Solution**: Check `wrapAddress()` function max characters (default 40) and max lines (default 2)

### Issue: Print output has extra margins
**Solution**: In print dialog, set margins to None/Minimum and disable headers/footers

### Issue: Item names are truncated
**Solution**: Item names limited to 30 characters - adjust `substring(0, 30)` in code if needed

### Issue: Grand Total not bold
**Solution**: Ensure `.grand-total` class has `font-weight: bold` and `font-size: 11px`

### Issue: Colored output instead of B&W
**Solution**: Check browser print settings - ensure "Background Graphics" follows your preference

---

## 📦 Browser Compatibility

✅ **Chrome/Edge**: Full support  
✅ **Firefox**: Full support  
✅ **Safari**: Full support  
✅ **Mobile Browsers**: Print-to-printer support varies by device  

---

## 🔐 Data Security

- All data rendered client-side only
- No data sent to external servers during printing
- Print preview in new window (isolated context)
- No cookies or tracking in receipt generation

---

## 📝 Version History

**v3.0** - Production Release
- Complete professional thermal receipt template
- All billing fields (subtotal, delivery, discount, tax)
- Auto-wrapping for address and item names
- Optimized CSS for thermal printers
- Bold grand total display
- Dashed and solid separator support
- Footer with generation timestamp

---

## 📞 Support & Customization

For customizations:
1. Font sizes: Adjust in CSS `@media print` section
2. Divider characters: Change dividerLine/dashedDivider in code
3. Header styling: Modify `.header` and `.header-logo` classes
4. Footer text: Edit footer section HTML
5. Color scheme: Currently B&W only (recommended for thermal)

---

**Last Updated**: June 24, 2026  
**Status**: Production Ready ✅  
**Tested on**: 80mm thermal printers, standard A4 printers
