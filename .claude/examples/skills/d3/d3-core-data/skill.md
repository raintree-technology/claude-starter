---
name: d3-core-data
description: Use when working with data transformations, scales, color schemes, formatting, or CSV/TSV parsing. Invoke for data processing pipelines, scale creation, color interpolation, number/date formatting, or data loading/parsing operations.
allowed-tools: Read, Grep, Glob
---

# D3 Core Data Expert

## Purpose

Expert knowledge of D3's core data manipulation, transformation, and formatting capabilities. Covers data arrays, collections, scales, color schemes, number/date formatting, and CSV/TSV parsing.

## When to Use

Invoke this skill when:
- Processing or transforming data arrays (sorting, filtering, grouping)
- Creating scales (linear, log, time, ordinal, band)
- Working with color schemes and interpolation
- Formatting numbers, dates, or currencies
- Parsing CSV, TSV, or DSV files
- Computing statistics (mean, median, extent, quantiles)
- Creating data accessors and comparators
- Building data processing pipelines
- Debugging scale or formatting issues

## Documentation Available

**Location**: `./docs/d3/`

**Coverage** (385 files):
- **Array Operations** (85 files):
  - Sorting, filtering, searching
  - Statistics: mean, median, sum, extent
  - Grouping, binning, histograms
  - Set operations, array utilities

- **Collections** (33 files):
  - d3.group, d3.rollup, d3.index
  - Map, Set, InternMap utilities
  - Nested data structures

- **Scales** (140 files):
  - Continuous: linear, log, pow, sqrt, symlog, time
  - Sequential: interpolation-based scales
  - Diverging: two-color scales
  - Quantize, quantile, threshold scales
  - Ordinal, band, point scales
  - Scale composition and inversion

- **Colors** (49 files from scale-chromatic):
  - Categorical schemes (10+ palettes)
  - Sequential schemes (single-hue, multi-hue)
  - Diverging schemes (RdBu, PiYG, etc.)
  - Color interpolators
  - Color space conversions

- **Color Module** (22 files):
  - RGB, HSL, Lab, HCL color spaces
  - Color parsing and manipulation
  - Color interpolation

- **Formatting** (11 files):
  - Number formatting (d3-format)
  - Locale-aware formatting
  - SI prefixes, currencies

- **Data Loading** (45 files total):
  - CSV/TSV parsing (d3-dsv: 33 files)
  - JSON, text fetching (d3-fetch: 12 files)
  - Auto-type conversion

## Related Skills

- **d3-shapes-paths**: For using scales with line/area generators
- **d3-geo**: For geographic scales and projections
- **d3-layouts-hierarchies**: For hierarchical data structures
- **d3-interaction-animation**: For animating scale transitions

## Best Practices

- **Use scale domains from data** - Compute extent with d3.extent()
- **Choose appropriate scale types** - Linear for continuous, band for categorical
- **Normalize data ranges** - Use d3.normalize() or d3.scaleLinear() with [0, 1] range
- **Use InternMap for keyed data** - Faster than native Map for string keys
- **Apply color schemes consistently** - Use d3.schemeCategory10 for categorical data
- **Format numbers for display** - d3.format() handles locales and SI prefixes
- **Parse dates consistently** - Use d3.timeParse() with ISO format strings
- **Handle missing data** - Use d3.mean(data, d => d.value) with accessor

## Examples

### Example 1: Data Processing Pipeline

**Question**: "How do I process and group sales data by category?"

**Response**:
```javascript
import * as d3 from 'd3';

const salesData = [
  { date: '2024-01-15', category: 'Electronics', amount: 1200 },
  { date: '2024-01-16', category: 'Clothing', amount: 450 },
  { date: '2024-01-16', category: 'Electronics', amount: 890 },
  { date: '2024-01-17', category: 'Electronics', amount: 2100 },
  { date: '2024-01-17', category: 'Clothing', amount: 680 },
];

// Parse dates
const parseTime = d3.timeParse('%Y-%m-%d');
salesData.forEach(d => {
  d.date = parseTime(d.date);
  d.amount = +d.amount; // Convert to number
});

// Group by category and compute statistics
const grouped = d3.rollup(
  salesData,
  v => ({
    total: d3.sum(v, d => d.amount),
    mean: d3.mean(v, d => d.amount),
    count: v.length,
  }),
  d => d.category
);

console.log(grouped);
// Map(2) {
//   'Electronics' => { total: 4190, mean: 1396.67, count: 3 },
//   'Clothing' => { total: 1130, mean: 565, count: 2 }
// }

// Sort by total descending
const sorted = Array.from(grouped, ([key, value]) => ({ category: key, ...value }))
  .sort((a, b) => d3.descending(a.total, b.total));

console.log(sorted);
// [
//   { category: 'Electronics', total: 4190, mean: 1396.67, count: 3 },
//   { category: 'Clothing', total: 1130, mean: 565, count: 2 }
// ]
```

**Key Functions**:
- `d3.rollup()` - Group and aggregate data
- `d3.sum()`, `d3.mean()` - Compute statistics
- `d3.descending()` - Sort comparator

**References**:
- See: `docs/d3/collection/`
- See: `docs/d3/array/`

### Example 2: Creating and Using Scales

**Question**: "How do I create scales for a scatter plot?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = [
  { x: 30, y: 20, size: 10, category: 'A' },
  { x: 50, y: 80, size: 25, category: 'B' },
  { x: 80, y: 50, size: 15, category: 'A' },
  { x: 120, y: 90, size: 30, category: 'C' },
];

// Create scales
const xScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.x)]) // [0, 120]
  .range([0, 800]) // SVG width
  .nice(); // Round to nice numbers

const yScale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.y)) // [20, 90]
  .range([400, 0]) // SVG height (inverted)
  .nice();

const sizeScale = d3.scaleSqrt()
  .domain([0, d3.max(data, d => d.size)])
  .range([3, 20]); // Circle radius

const colorScale = d3.scaleOrdinal()
  .domain(['A', 'B', 'C'])
  .range(d3.schemeCategory10);

// Use scales
data.forEach(d => {
  console.log({
    x: xScale(d.x),      // 200, 333, 533, 800
    y: yScale(d.y),      // 389, 29, 214, 0
    r: sizeScale(d.size), // 8.2, 16.1, 11, 20
    fill: colorScale(d.category), // Colors from scheme
  });
});

// Invert scale (e.g., for mouse position)
const mouseX = 400;
const dataX = xScale.invert(mouseX); // ~60
```

**Scale Types**:
- `scaleLinear()` - Continuous numeric mapping
- `scaleSqrt()` - Square root scale (better for areas)
- `scaleOrdinal()` - Categorical mapping
- `scaleTime()` - For date/time domains

**References**:
- See: `docs/d3/scale/`
- See: `docs/d3/scale-chromatic/`

### Example 3: Color Schemes

**Question**: "How do I use D3 color schemes and interpolation?"

**Response**:
```javascript
import * as d3 from 'd3';

// Categorical colors (discrete)
const categoricalColors = d3.schemeCategory10;
console.log(categoricalColors); // Array of 10 colors

const categoryScale = d3.scaleOrdinal()
  .domain(['apple', 'banana', 'cherry'])
  .range(d3.schemeSet2);

// Sequential colors (continuous)
const sequentialScale = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateBlues);

console.log(sequentialScale(0));   // Light blue
console.log(sequentialScale(50));  // Medium blue
console.log(sequentialScale(100)); // Dark blue

// Diverging colors (continuous with midpoint)
const divergingScale = d3.scaleDiverging()
  .domain([-10, 0, 10])
  .interpolator(d3.interpolateRdYlGn);

console.log(divergingScale(-10)); // Red
console.log(divergingScale(0));   // Yellow
console.log(divergingScale(10));  // Green

// Custom color interpolation
const colorInterpolator = d3.interpolateRgb('steelblue', 'brown');
console.log(colorInterpolator(0));   // steelblue
console.log(colorInterpolator(0.5)); // middle color
console.log(colorInterpolator(1));   // brown

// Color manipulation
const color = d3.rgb('steelblue');
console.log(color.brighter(1)); // Lighter
console.log(color.darker(1));   // Darker
console.log(color.opacity(0.5)); // With alpha

// Convert between color spaces
const lab = d3.lab('steelblue');
console.log(lab); // { l, a, b }
```

**Color Schemes Available**:
- Categorical: Category10, Accent, Dark2, Set1, Set2, Set3
- Sequential: Blues, Greens, Reds, Oranges, Purples, Greys
- Diverging: RdBu, RdYlGn, PiYG, BrBG, Spectral

**References**:
- See: `docs/d3/scale-chromatic/`
- See: `docs/d3/color/`

### Example 4: Number and Date Formatting

**Question**: "How do I format numbers and dates for display?"

**Response**:
```javascript
import * as d3 from 'd3';

// Number formatting
const formatNumber = d3.format(','); // Thousands separator
console.log(formatNumber(1234567)); // "1,234,567"

const formatCurrency = d3.format('$,.2f'); // Currency with 2 decimals
console.log(formatCurrency(1234.5)); // "$1,234.50"

const formatPercent = d3.format('.1%'); // Percentage with 1 decimal
console.log(formatPercent(0.1234)); // "12.3%"

const formatSI = d3.format('.3s'); // SI prefix
console.log(formatSI(1234567)); // "1.23M"
console.log(formatSI(0.001234)); // "1.23m"

const formatPrecision = d3.format('.2f'); // Fixed precision
console.log(formatPrecision(Math.PI)); // "3.14"

// Date formatting
const formatTime = d3.timeFormat('%Y-%m-%d');
const date = new Date('2024-01-15T12:30:00');
console.log(formatTime(date)); // "2024-01-15"

const formatDateTime = d3.timeFormat('%B %d, %Y at %I:%M %p');
console.log(formatDateTime(date)); // "January 15, 2024 at 12:30 PM"

const formatShort = d3.timeFormat('%b %d');
console.log(formatShort(date)); // "Jan 15"

// Parse dates
const parseTime = d3.timeParse('%Y-%m-%d');
const parsed = parseTime('2024-01-15');
console.log(parsed); // Date object

// Locale-specific formatting
const frenchFormat = d3.formatLocale({
  decimal: ',',
  thousands: '\u00a0',
  grouping: [3],
  currency: ['', '\u00a0€'],
});

const formatEuro = frenchFormat.format('$,.2f');
console.log(formatEuro(1234.5)); // "1 234,50 €"
```

**Format Specifiers**:
- `,` - Thousands separator
- `.nf` - Fixed decimal places
- `$` - Currency symbol
- `%` - Multiply by 100 and add %
- `.ns` - SI prefix (K, M, G, etc.)

**References**:
- See: `docs/d3/format/`
- See: `docs/d3/time-format/`

### Example 5: CSV/TSV Data Loading

**Question**: "How do I load and parse CSV data?"

**Response**:
```javascript
import * as d3 from 'd3';

// Load CSV from URL
const data = await d3.csv('/data/sales.csv');
console.log(data);
// [
//   { date: '2024-01-15', sales: '1200', category: 'Electronics' },
//   { date: '2024-01-16', sales: '450', category: 'Clothing' },
//   ...
// ]

// Load with type conversion
const typedData = await d3.csv('/data/sales.csv', d => ({
  date: d3.timeParse('%Y-%m-%d')(d.date),
  sales: +d.sales,
  category: d.category,
}));

// Load with auto-type conversion
const autoTyped = await d3.csv('/data/sales.csv', d3.autoType);

// Load TSV (tab-separated)
const tsvData = await d3.tsv('/data/sales.tsv');

// Load custom delimiter
const customData = await d3.dsv('|', '/data/sales.txt');

// Parse CSV string
const csvString = `date,sales,category
2024-01-15,1200,Electronics
2024-01-16,450,Clothing`;

const parsed = d3.csvParse(csvString);
console.log(parsed);

// Parse with type conversion
const typedParsed = d3.csvParse(csvString, d => ({
  date: new Date(d.date),
  sales: +d.sales,
  category: d.category,
}));

// Format to CSV
const output = d3.csvFormat(data);
console.log(output);
// date,sales,category
// 2024-01-15,1200,Electronics
// 2024-01-16,450,Clothing

// Custom formatting
const customOutput = d3.csvFormatRows([
  ['date', 'sales', 'category'],
  ['2024-01-15', '1200', 'Electronics'],
]);
```

**Auto-type Conversions**:
- Numbers: `"123"` → `123`
- Booleans: `"true"` → `true`
- Dates: `"2024-01-15"` → `Date`
- `"NA"` or empty → `null`

**References**:
- See: `docs/d3/dsv/`
- See: `docs/d3/fetch/`

## Common Patterns

### Compute Data Extent
```javascript
const [min, max] = d3.extent(data, d => d.value);
const domain = [0, max]; // Start from zero
```

### Group Data by Multiple Keys
```javascript
const grouped = d3.rollup(
  data,
  v => v.length,
  d => d.year,
  d => d.category
);
// Map(year -> Map(category -> count))
```

### Create Histogram Bins
```javascript
const histogram = d3.bin()
  .domain([0, 100])
  .thresholds(10); // 10 bins

const bins = histogram(data.map(d => d.value));
```

### Color Scale with Thresholds
```javascript
const colorScale = d3.scaleThreshold()
  .domain([10, 20, 30])
  .range(['green', 'yellow', 'orange', 'red']);
```

### Time Scale for Dates
```javascript
const timeScale = d3.scaleTime()
  .domain([new Date('2024-01-01'), new Date('2024-12-31')])
  .range([0, 800]);
```

## Search Helpers

```bash
# Find scale documentation
grep -r "scale\|domain\|range" ./docs/d3/scale/

# Find color scheme docs
grep -r "scheme\|interpolate\|color" ./docs/d3/scale-chromatic/

# Find array operations
grep -r "mean\|sum\|extent\|group" ./docs/d3/array/

# Find formatting docs
grep -r "format\|locale" ./docs/d3/format/

# Find CSV parsing
grep -r "csv\|tsv\|dsv\|parse" ./docs/d3/dsv/

# List all data modules
ls ./docs/d3/
```

## Common Errors

- **Scale domain is undefined**: Data hasn't loaded or accessor is wrong
  - Solution: Check d3.extent() returns valid [min, max]

- **Colors not showing**: Wrong scale type for data
  - Solution: Use scaleOrdinal for categorical, scaleSequential for continuous

- **Dates not parsing**: Format string doesn't match input
  - Solution: Match d3.timeParse() format to your date strings (e.g., '%Y-%m-%d')

- **CSV numbers are strings**: No type conversion applied
  - Solution: Use d3.autoType or manual conversion with `+d.value`

- **Scale inversion fails**: Can't invert ordinal scales
  - Solution: Only continuous scales support .invert()

## Performance Tips

1. **Use d3.InternMap** - Faster than native Map for string keys
2. **Avoid recomputing domains** - Cache extent calculations
3. **Use scale.copy()** - Clone scales instead of recreating
4. **Bin large datasets** - Use d3.bin() before rendering
5. **Parse dates once** - Don't re-parse in render loops
6. **Use d3.ticks()** - Generates nice axis values efficiently

## Notes

- Documentation covers D3 v7 (latest version)
- All scale types are immutable - methods return new scales
- Color interpolation uses Lab color space by default (perceptually uniform)
- d3.autoType handles most common CSV type conversions
- InternMap is D3's optimized Map implementation
- File paths reference local documentation cache
- For latest updates, check https://d3js.org/d3-array
