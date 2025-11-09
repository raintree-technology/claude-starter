---
name: d3-shapes-paths
description: Use when creating SVG shapes, paths, or generators for charts. Invoke for line/area/arc generators, curves, symbols, pie/donut charts, stacks, ribbons, or path manipulation operations.
allowed-tools: Read, Grep, Glob
---

# D3 Shapes & Paths Expert

## Purpose

Expert knowledge of D3's shape generators and path manipulation. Covers line, area, arc, pie, symbol, stack, ribbon generators, curve interpolation, and SVG path construction.

## When to Use

Invoke this skill when:
- Creating line or area charts
- Building pie or donut charts
- Generating arc segments (gauges, progress indicators)
- Creating stacked charts (bar, area)
- Working with curve interpolation
- Drawing symbols (circles, squares, diamonds)
- Building chord diagrams
- Generating contour plots
- Manipulating SVG paths
- Debugging shape rendering issues

## Documentation Available

**Location**: `./docs/d3/`

**Coverage** (203 files):
- **Shapes** (146 files):
  - Lines: line generator, curve interpolation
  - Areas: area generator, radial areas
  - Arcs: arc generator, pie layout
  - Symbols: symbol types and custom symbols
  - Stacks: stack layout, stack order
  - Links: link generators (orthogonal, radial)
  - Curves: 15+ interpolation types

- **Paths** (12 files):
  - Path construction and serialization
  - Path data parsing
  - Geometric operations

- **Contours** (17 files):
  - Contour generation
  - Density estimation
  - Marching squares algorithm

- **Chords** (22 files):
  - Chord layout
  - Ribbon generator
  - Chord diagrams

- **Polygons** (6 files):
  - Polygon operations
  - Hull, centroid, area calculations

## Related Skills

- **d3-core-data**: For scales used with shapes
- **d3-geo**: For geographic path generators
- **d3-interaction-animation**: For animating shapes
- **d3-layouts-hierarchies**: For tree/network shapes

## Best Practices

- **Define accessors consistently** - Use x/y accessors for data binding
- **Use curve interpolators** - Choose appropriate curve type for data
- **Handle null data** - Set .defined() to skip gaps in lines
- **Use radial variants** - For circular/polar charts
- **Optimize path rendering** - Simplify paths for large datasets
- **Set arc padding** - Add spacing in pie charts
- **Use stack keys** - Define series for stacked charts
- **Apply proper transforms** - Translate arcs to center

## Examples

### Example 1: Line Chart with Multiple Series

**Question**: "How do I create a multi-series line chart?"

**Response**:
```javascript
import * as d3 from 'd3';

// Sample data
const data = [
  { date: new Date('2024-01-01'), series1: 30, series2: 20 },
  { date: new Date('2024-01-02'), series1: 45, series2: 35 },
  { date: new Date('2024-01-03'), series1: 40, series2: 30 },
  { date: new Date('2024-01-04'), series1: null, series2: 40 }, // Gap in series1
  { date: new Date('2024-01-05'), series1: 60, series2: 50 },
];

// Create scales
const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, 800]);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => Math.max(d.series1 || 0, d.series2))])
  .range([400, 0])
  .nice();

// Create line generator
const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.value))
  .curve(d3.curveMonotoneX) // Smooth curve
  .defined(d => d.value != null); // Skip null values

// Transform data for each series
const series1Data = data.map(d => ({ date: d.date, value: d.series1 }));
const series2Data = data.map(d => ({ date: d.date, value: d.series2 }));

// Generate path data
const path1 = line(series1Data);
const path2 = line(series2Data);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

// Add lines
svg.append('path')
  .attr('d', path1)
  .attr('fill', 'none')
  .attr('stroke', 'steelblue')
  .attr('stroke-width', 2);

svg.append('path')
  .attr('d', path2)
  .attr('fill', 'none')
  .attr('stroke', 'orange')
  .attr('stroke-width', 2);

// Add axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append('g')
  .attr('transform', 'translate(0, 400)')
  .call(xAxis);

svg.append('g')
  .call(yAxis);
```

**Curve Types**:
- `curveLinear` - Straight lines (default)
- `curveMonotoneX` - Smooth, no overshoot
- `curveCatmullRom` - Smooth, passes through points
- `curveBasis` - Smooth B-spline
- `curveStep` - Step function

**References**:
- See: `docs/d3/shape/line.md`
- See: `docs/d3/shape/curve.md`

### Example 2: Area Chart with Gradient

**Question**: "How do I create an area chart with gradient fill?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = [
  { x: 0, y0: 0, y1: 30 },
  { x: 1, y0: 0, y1: 45 },
  { x: 2, y0: 0, y1: 40 },
  { x: 3, y0: 0, y1: 60 },
  { x: 4, y0: 0, y1: 50 },
];

// Create scales
const xScale = d3.scaleLinear()
  .domain([0, 4])
  .range([0, 800]);

const yScale = d3.scaleLinear()
  .domain([0, 60])
  .range([400, 0]);

// Create area generator
const area = d3.area()
  .x(d => xScale(d.x))
  .y0(d => yScale(d.y0)) // Baseline
  .y1(d => yScale(d.y1)) // Top line
  .curve(d3.curveMonotoneX);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

// Define gradient
const gradient = svg.append('defs')
  .append('linearGradient')
  .attr('id', 'area-gradient')
  .attr('x1', '0%')
  .attr('y1', '0%')
  .attr('x2', '0%')
  .attr('y2', '100%');

gradient.append('stop')
  .attr('offset', '0%')
  .attr('stop-color', 'steelblue')
  .attr('stop-opacity', 0.8);

gradient.append('stop')
  .attr('offset', '100%')
  .attr('stop-color', 'steelblue')
  .attr('stop-opacity', 0.1);

// Add area
svg.append('path')
  .datum(data)
  .attr('d', area)
  .attr('fill', 'url(#area-gradient)');

// Add top line
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y1))
  .curve(d3.curveMonotoneX);

svg.append('path')
  .datum(data)
  .attr('d', line)
  .attr('fill', 'none')
  .attr('stroke', 'steelblue')
  .attr('stroke-width', 2);
```

**Radial Area (for circular charts)**:
```javascript
const radialArea = d3.areaRadial()
  .angle(d => angleScale(d.angle))
  .innerRadius(d => radiusScale(d.inner))
  .outerRadius(d => radiusScale(d.outer));
```

**References**:
- See: `docs/d3/shape/area.md`
- See: `docs/d3/shape/radial.md`

### Example 3: Pie and Donut Charts

**Question**: "How do I create a pie chart with labels?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = [
  { category: 'A', value: 30 },
  { category: 'B', value: 80 },
  { category: 'C', value: 45 },
  { category: 'D', value: 60 },
];

// Create pie layout
const pie = d3.pie()
  .value(d => d.value)
  .sort(null) // Keep original order
  .padAngle(0.02); // Spacing between slices

// Create arc generator
const arc = d3.arc()
  .innerRadius(0) // Use innerRadius > 0 for donut
  .outerRadius(150);

// Arc for labels (slightly outside)
const labelArc = d3.arc()
  .innerRadius(170)
  .outerRadius(170);

// Color scale
const color = d3.scaleOrdinal()
  .domain(data.map(d => d.category))
  .range(d3.schemeCategory10);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 400)
  .attr('height', 400);

const g = svg.append('g')
  .attr('transform', 'translate(200, 200)'); // Center

// Generate pie data
const pieData = pie(data);

// Add arcs
g.selectAll('path')
  .data(pieData)
  .join('path')
  .attr('d', arc)
  .attr('fill', d => color(d.data.category))
  .attr('stroke', 'white')
  .attr('stroke-width', 2);

// Add labels
g.selectAll('text')
  .data(pieData)
  .join('text')
  .attr('transform', d => `translate(${labelArc.centroid(d)})`)
  .attr('text-anchor', 'middle')
  .text(d => d.data.category);

// Add percentage labels
g.selectAll('.percentage')
  .data(pieData)
  .join('text')
  .attr('class', 'percentage')
  .attr('transform', d => `translate(${arc.centroid(d)})`)
  .attr('text-anchor', 'middle')
  .attr('fill', 'white')
  .attr('font-weight', 'bold')
  .text(d => {
    const percent = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
    return `${percent}%`;
  });
```

**Donut Chart** (add inner radius):
```javascript
const arc = d3.arc()
  .innerRadius(80)  // Creates donut hole
  .outerRadius(150);
```

**Corner Radius** (rounded corners):
```javascript
const arc = d3.arc()
  .innerRadius(80)
  .outerRadius(150)
  .cornerRadius(5);
```

**References**:
- See: `docs/d3/shape/pie.md`
- See: `docs/d3/shape/arc.md`

### Example 4: Stacked Area Chart

**Question**: "How do I create a stacked area chart?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = [
  { date: new Date('2024-01-01'), apples: 30, bananas: 20, oranges: 10 },
  { date: new Date('2024-01-02'), apples: 45, bananas: 35, oranges: 15 },
  { date: new Date('2024-01-03'), apples: 40, bananas: 30, oranges: 20 },
  { date: new Date('2024-01-04'), apples: 60, bananas: 40, oranges: 25 },
];

// Define stack keys (series)
const keys = ['apples', 'bananas', 'oranges'];

// Create stack layout
const stack = d3.stack()
  .keys(keys)
  .order(d3.stackOrderNone) // Keep original order
  .offset(d3.stackOffsetNone); // Start from zero

// Generate stack data
const stackedData = stack(data);
// [
//   [[0, 30], [0, 45], ...],     // apples layer
//   [[30, 50], [45, 80], ...],   // bananas layer
//   [[50, 60], [80, 95], ...],   // oranges layer
// ]

// Create scales
const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, 800]);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
  .range([400, 0])
  .nice();

// Create area generator
const area = d3.area()
  .x(d => xScale(d.data.date))
  .y0(d => yScale(d[0])) // Bottom of stack
  .y1(d => yScale(d[1])) // Top of stack
  .curve(d3.curveMonotoneX);

// Color scale
const color = d3.scaleOrdinal()
  .domain(keys)
  .range(d3.schemeCategory10);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

// Add layers
svg.selectAll('path')
  .data(stackedData)
  .join('path')
  .attr('d', area)
  .attr('fill', d => color(d.key))
  .attr('stroke', 'white')
  .attr('stroke-width', 1);

// Add legend
const legend = svg.append('g')
  .attr('transform', 'translate(700, 20)');

legend.selectAll('rect')
  .data(keys)
  .join('rect')
  .attr('y', (d, i) => i * 25)
  .attr('width', 20)
  .attr('height', 20)
  .attr('fill', d => color(d));

legend.selectAll('text')
  .data(keys)
  .join('text')
  .attr('x', 25)
  .attr('y', (d, i) => i * 25 + 15)
  .text(d => d);
```

**Stack Orders**:
- `stackOrderNone` - Original order
- `stackOrderAscending` - Smallest on top
- `stackOrderDescending` - Largest on top
- `stackOrderInsideOut` - Largest in middle

**Stack Offsets**:
- `stackOffsetNone` - Zero baseline
- `stackOffsetExpand` - Normalize to [0, 1]
- `stackOffsetSilhouette` - Center around zero
- `stackOffsetWiggle` - Minimize changes in slope

**References**:
- See: `docs/d3/shape/stack.md`

### Example 5: Symbols and Custom Shapes

**Question**: "How do I use D3 symbols for scatter plots?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = [
  { x: 30, y: 20, type: 'A' },
  { x: 50, y: 80, type: 'B' },
  { x: 80, y: 50, type: 'A' },
  { x: 120, y: 90, type: 'C' },
];

// Create scales
const xScale = d3.scaleLinear()
  .domain([0, 150])
  .range([0, 800]);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([400, 0]);

// Symbol types
const symbolTypes = [
  d3.symbolCircle,
  d3.symbolSquare,
  d3.symbolTriangle,
  d3.symbolStar,
  d3.symbolDiamond,
  d3.symbolCross,
];

// Symbol scale
const symbolScale = d3.scaleOrdinal()
  .domain(['A', 'B', 'C'])
  .range([d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle]);

// Create symbol generator
const symbol = d3.symbol()
  .size(200); // Area in square pixels

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

// Add symbols
svg.selectAll('path')
  .data(data)
  .join('path')
  .attr('d', d => {
    symbol.type(symbolScale(d.type));
    return symbol();
  })
  .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)
  .attr('fill', 'steelblue')
  .attr('stroke', 'white')
  .attr('stroke-width', 2);
```

**Available Symbol Types**:
- `symbolCircle` - Circle
- `symbolSquare` - Square
- `symbolTriangle` - Upward triangle
- `symbolStar` - Five-pointed star
- `symbolDiamond` - Diamond
- `symbolCross` - Plus sign
- `symbolWye` - Y shape

**Custom Symbol**:
```javascript
const customSymbol = {
  draw(context, size) {
    const r = Math.sqrt(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  },
};

const symbol = d3.symbol()
  .type(customSymbol)
  .size(200);
```

**References**:
- See: `docs/d3/shape/symbol.md`

## Common Patterns

### Responsive Line Chart
```javascript
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y))
  .curve(d3.curveMonotoneX);

svg.append('path')
  .datum(data)
  .attr('d', line)
  .attr('fill', 'none')
  .attr('stroke', 'steelblue')
  .attr('stroke-width', 2);
```

### Arc with Hover Effect
```javascript
const arc = d3.arc()
  .innerRadius(80)
  .outerRadius(150);

const arcHover = d3.arc()
  .innerRadius(80)
  .outerRadius(160); // Larger

svg.selectAll('path')
  .on('mouseenter', function() {
    d3.select(this).transition()
      .attr('d', arcHover);
  })
  .on('mouseleave', function() {
    d3.select(this).transition()
      .attr('d', arc);
  });
```

### Link Generators (for node diagrams)
```javascript
const link = d3.linkHorizontal()
  .x(d => d.x)
  .y(d => d.y);

const linkData = {
  source: { x: 0, y: 100 },
  target: { x: 200, y: 150 },
};

svg.append('path')
  .attr('d', link(linkData))
  .attr('fill', 'none')
  .attr('stroke', 'black');
```

## Search Helpers

```bash
# Find line/area docs
grep -r "line\|area\|curve" ./docs/d3/shape/

# Find pie/arc docs
grep -r "pie\|arc\|donut" ./docs/d3/shape/

# Find stack docs
grep -r "stack\|layer" ./docs/d3/shape/

# Find symbol docs
grep -r "symbol\|scatter" ./docs/d3/shape/

# Find path operations
grep -r "path\|serialize" ./docs/d3/path/

# List shape generators
ls ./docs/d3/shape/
```

## Common Errors

- **Path not rendering**: Check scale domains match data range
  - Solution: Use d3.extent() to compute correct domain

- **Area chart inverted**: Y scale range is backwards
  - Solution: Set range as [height, 0] (SVG y grows downward)

- **Pie chart off-center**: Missing transform translate
  - Solution: Add `transform="translate(cx, cy)"` to group

- **Gaps in line**: Null/undefined values in data
  - Solution: Set `.defined(d => d.value != null)`

- **Stack negative values**: stackOffsetNone doesn't handle negatives
  - Solution: Use stackOffsetDiverging for +/- values

## Performance Tips

1. **Use .curve(d3.curveLinear)** - Fastest rendering
2. **Simplify paths** - Use fewer data points for large datasets
3. **Avoid recomputing generators** - Create once, reuse
4. **Use context rendering** - For Canvas instead of SVG
5. **Batch path updates** - Use .datum() instead of .data() when possible
6. **Optimize arc rendering** - Use fewer padAngle for large datasets

## Notes

- Documentation covers D3 v7 (latest version)
- All generators support both SVG and Canvas contexts
- Curve interpolators are interchangeable across line/area generators
- Pie layout computes startAngle and endAngle for each datum
- Stack layout adds [y0, y1] arrays to each data point
- Symbol size is in square pixels (area, not radius)
- Path generators are immutable - methods return new generators
- File paths reference local documentation cache
- For latest updates, check https://d3js.org/d3-shape
