# Year-over-Year Performance Fix

## Issue Fixed ✅
**Problem**: Year-over-year performance was only showing 2025 data even when data was added for 2020 or other years.

## Root Cause
The year extraction logic was not properly prioritizing the `reportingYear` field from the data entry form, causing all data to default to the current year (2025).

## Solution Implemented

### 1. Fixed Year Extraction Logic
```javascript
// Before: Only used timestamp, ignored reportingYear
let year = null;
if (item.timestamp) {
  try {
    year = new Date(item.timestamp).getFullYear();
  } catch {
    year = item.reportingYear || new Date().getFullYear();
  }
}

// After: Prioritizes reportingYear field
let year = null;

// Priority order: reportingYear -> timestamp -> current year
if (item.reportingYear && !isNaN(parseInt(item.reportingYear))) {
  year = parseInt(item.reportingYear);
} else if (item.timestamp) {
  try {
    year = new Date(item.timestamp).getFullYear();
  } catch {
    year = new Date().getFullYear();
  }
} else {
  year = new Date().getFullYear();
}
```

### 2. Enhanced Year Validation
```javascript
// Filter out invalid years and sort properly
const years = [...new Set(normalized.map(item => item.year))]
  .filter(year => year && !isNaN(year))
  .sort((a, b) => b - a);
```

### 3. Improved Year Selector
```javascript
// Sort years in descending order and filter invalid entries
yearlyData
  .filter(entry => entry.year && !isNaN(entry.year))
  .sort((a, b) => b.year - a.year)
  .map(entry => (
    <option key={entry.year} value={entry.year}>
      {entry.year}
    </option>
  ))
```

## How It Works Now ✅

1. **Data Entry**: When you enter data with `reportingYear: 2020`, it will be properly stored with that year
2. **Year Extraction**: The system now prioritizes the `reportingYear` field over timestamp
3. **Year Selection**: The dropdown shows all available years sorted from newest to oldest
4. **Year-over-Year Table**: Displays data for all years with proper year attribution

## Test Scenario
1. Add ESG data with `reportingYear: 2020`
2. Add ESG data with `reportingYear: 2021` 
3. Add ESG data with `reportingYear: 2022`
4. Go to Reports → Year-over-Year Performance
5. ✅ You should see all three years (2020, 2021, 2022) in the table
6. ✅ Year selector dropdown should show all available years
7. ✅ Selecting a year should highlight that row in the table

## Files Modified
- `src/Reports.js` - Fixed year extraction and validation logic

## Status: ✅ RESOLVED
The year-over-year performance now correctly shows data for all years based on the `reportingYear` field from the data entry form, not just the current year (2025).