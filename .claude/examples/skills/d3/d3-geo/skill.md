---
name: d3-geo
description: Use when creating maps, working with geographic projections, or processing GeoJSON data. Invoke for world maps, choropleth maps, projection types, geo path generators, spherical geometry, or geographic feature manipulation.
allowed-tools: Read, Grep, Glob
---

# D3 Geographic Visualization Expert

## Purpose

Expert knowledge of D3's geographic projections and map rendering. Covers map projections, GeoJSON processing, geographic path generators, spherical geometry, and cartographic features.

## When to Use

Invoke this skill when:
- Creating world maps or regional maps
- Working with GeoJSON or TopoJSON data
- Choosing or configuring map projections
- Building choropleth (colored region) maps
- Computing geographic centroids or bounds
- Measuring distances on a sphere
- Creating globe visualizations
- Rotating or clipping projections
- Handling geographic coordinates
- Debugging map rendering issues

## Documentation Available

**Location**: `./docs/d3/`

**Coverage** (266 files):
- **Core Geography** (91 files):
  - Path generator for rendering GeoJSON
  - Spherical math (distance, area, length)
  - Geographic bounds and centroids
  - Great circle interpolation
  - Clipping and rotation

- **Projections** (151 files):
  - 30+ projection types
  - Azimuthal: orthographic, stereographic, gnomonic
  - Cylindrical: Mercator, equirectangular
  - Conic: Albers, Lambert conformal
  - Composite projections
  - Projection configuration (scale, translate, rotate)

- **Polygon Operations** (24 files):
  - Spherical polygon area
  - Polygon contains point
  - Polygon clipping
  - Polygon centroid

## Related Skills

- **d3-core-data**: For color scales in choropleth maps
- **d3-shapes-paths**: For combining geo with other shapes
- **d3-interaction-animation**: For interactive maps
- **d3-layouts-hierarchies**: For hierarchical geographic data

## Best Practices

- **Use appropriate projections** - Mercator for web tiles, Albers for US maps
- **Fit projections to bounds** - Use .fitSize() or .fitExtent()
- **Simplify TopoJSON** - Reduce file size for web delivery
- **Handle dateline wrapping** - Use antimeridian clipping
- **Set precision carefully** - Balance quality vs. performance
- **Use geographic centroids** - More accurate than planar centroids
- **Cache path generator** - Reuse for multiple features
- **Consider adaptive sampling** - For large datasets

## Examples

### Example 1: Basic World Map

**Question**: "How do I create a simple world map?"

**Response**:
```javascript
import * as d3 from 'd3';

// Load GeoJSON data
const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

// Convert TopoJSON to GeoJSON
const countries = topojson.feature(worldData, worldData.objects.countries);

// Create projection
const projection = d3.geoNaturalEarth1()
  .scale(200)
  .translate([400, 300]); // Center of SVG

// Create path generator
const path = d3.geoPath()
  .projection(projection);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw countries
svg.selectAll('path')
  .data(countries.features)
  .join('path')
  .attr('d', path)
  .attr('fill', '#ccc')
  .attr('stroke', '#fff')
  .attr('stroke-width', 0.5);

// Add graticule (grid lines)
const graticule = d3.geoGraticule();

svg.append('path')
  .datum(graticule())
  .attr('d', path)
  .attr('fill', 'none')
  .attr('stroke', '#ddd')
  .attr('stroke-width', 0.5);

// Add sphere outline
svg.append('path')
  .datum({ type: 'Sphere' })
  .attr('d', path)
  .attr('fill', 'none')
  .attr('stroke', '#000')
  .attr('stroke-width', 1.5);
```

**Auto-fit projection to data**:
```javascript
const projection = d3.geoNaturalEarth1()
  .fitSize([800, 600], countries);
```

**References**:
- See: `docs/d3/geo/path.md`
- See: `docs/d3/geo-projection/`

### Example 2: US State Choropleth Map

**Question**: "How do I create a choropleth map with state-level data?"

**Response**:
```javascript
import * as d3 from 'd3';

// Load US states TopoJSON
const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
const states = topojson.feature(us, us.objects.states);

// Sample data (state ID -> value)
const data = new Map([
  ['01', 45], // Alabama
  ['06', 82], // California
  ['36', 68], // New York
  // ... more states
]);

// Create projection optimized for US
const projection = d3.geoAlbersUsa()
  .scale(1000)
  .translate([400, 300]);

const path = d3.geoPath()
  .projection(projection);

// Create color scale
const colorScale = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateBlues);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw states
svg.selectAll('path')
  .data(states.features)
  .join('path')
  .attr('d', path)
  .attr('fill', d => {
    const value = data.get(d.id);
    return value ? colorScale(value) : '#ccc';
  })
  .attr('stroke', '#fff')
  .attr('stroke-width', 0.5)
  .on('mouseenter', function(event, d) {
    d3.select(this)
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    // Show tooltip
    const value = data.get(d.id);
    console.log(`${d.properties.name}: ${value}`);
  })
  .on('mouseleave', function() {
    d3.select(this)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
  });

// Add legend
const legendWidth = 300;
const legendHeight = 10;

const legend = svg.append('g')
  .attr('transform', 'translate(250, 550)');

// Create gradient for legend
const defs = svg.append('defs');
const gradient = defs.append('linearGradient')
  .attr('id', 'legend-gradient');

gradient.selectAll('stop')
  .data(d3.range(0, 1.1, 0.1))
  .join('stop')
  .attr('offset', d => `${d * 100}%`)
  .attr('stop-color', d => colorScale(d * 100));

legend.append('rect')
  .attr('width', legendWidth)
  .attr('height', legendHeight)
  .style('fill', 'url(#legend-gradient)');

// Add legend axis
const legendScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
  .ticks(5);

legend.append('g')
  .attr('transform', `translate(0, ${legendHeight})`)
  .call(legendAxis);
```

**Albers USA Projection**:
- Optimized for US maps
- Automatically positions Alaska and Hawaii
- Better area representation than Mercator

**References**:
- See: `docs/d3/geo-projection/albers-usa.md`

### Example 3: Interactive Globe with Rotation

**Question**: "How do I create a draggable globe?"

**Response**:
```javascript
import * as d3 from 'd3';

// Load world data
const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
const countries = topojson.feature(world, world.objects.countries);

// Create orthographic projection (globe)
const projection = d3.geoOrthographic()
  .scale(250)
  .translate([400, 300])
  .rotate([0, 0]); // [longitude, latitude, roll]

const path = d3.geoPath()
  .projection(projection);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Add ocean (sphere background)
svg.append('path')
  .datum({ type: 'Sphere' })
  .attr('class', 'ocean')
  .attr('d', path)
  .attr('fill', '#a8d5ff');

// Add countries
const countriesGroup = svg.append('g')
  .selectAll('path')
  .data(countries.features)
  .join('path')
  .attr('d', path)
  .attr('fill', '#bbb')
  .attr('stroke', '#fff')
  .attr('stroke-width', 0.5);

// Add graticule
const graticule = d3.geoGraticule();
svg.append('path')
  .datum(graticule())
  .attr('d', path)
  .attr('fill', 'none')
  .attr('stroke', '#ccc')
  .attr('stroke-width', 0.5)
  .attr('opacity', 0.5);

// Add drag behavior
const drag = d3.drag()
  .on('start', function(event) {
    // Store starting rotation
    this._rotation = projection.rotate();
    this._coords = [event.x, event.y];
  })
  .on('drag', function(event) {
    const rotation = this._rotation;
    const coords = this._coords;

    // Calculate rotation delta
    const dx = event.x - coords[0];
    const dy = event.y - coords[1];

    // Update projection rotation
    projection.rotate([
      rotation[0] + dx * 0.5,
      rotation[1] - dy * 0.5,
    ]);

    // Re-render
    svg.selectAll('path').attr('d', path);
  });

svg.call(drag);

// Add zoom behavior
const zoom = d3.zoom()
  .scaleExtent([0.5, 5])
  .on('zoom', (event) => {
    projection.scale(250 * event.transform.k);
    svg.selectAll('path').attr('d', path);
  });

svg.call(zoom);
```

**Other 3D Projections**:
- `geoOrthographic()` - Globe view
- `geoStereographic()` - Perspective from point
- `geoGnomonic()` - Great circles as straight lines

**References**:
- See: `docs/d3/geo-projection/orthographic.md`

### Example 4: Computing Geographic Measurements

**Question**: "How do I calculate distances and areas on a sphere?"

**Response**:
```javascript
import * as d3 from 'd3';

// Define coordinates [longitude, latitude]
const newYork = [-74.006, 40.7128];
const london = [-0.1278, 51.5074];
const tokyo = [139.6917, 35.6895];

// Calculate great circle distance (in radians)
const distanceRadians = d3.geoDistance(newYork, london);
console.log('Distance (radians):', distanceRadians);

// Convert to kilometers (Earth radius = 6371 km)
const distanceKm = distanceRadians * 6371;
console.log('Distance (km):', distanceKm.toFixed(0)); // ~5,570 km

// Calculate area of polygon (in steradians)
const polygon = {
  type: 'Polygon',
  coordinates: [[
    [-74, 40],
    [-73, 40],
    [-73, 41],
    [-74, 41],
    [-74, 40],
  ]],
};

const areaSteradians = d3.geoArea(polygon);
console.log('Area (steradians):', areaSteradians);

// Convert to square kilometers (Earth surface area = 510M km²)
const areaKm2 = areaSteradians * (6371 * 6371);
console.log('Area (km²):', areaKm2.toFixed(0));

// Calculate path length
const lineString = {
  type: 'LineString',
  coordinates: [newYork, london],
};

const lengthRadians = d3.geoLength(lineString);
const lengthKm = lengthRadians * 6371;
console.log('Path length (km):', lengthKm.toFixed(0));

// Calculate centroid
const centroid = d3.geoCentroid(polygon);
console.log('Centroid [lon, lat]:', centroid);

// Check if point is inside polygon
const point = [-73.5, 40.5];
const contains = d3.geoContains(polygon, point);
console.log('Contains point:', contains); // true or false

// Interpolate along great circle
const interpolate = d3.geoInterpolate(newYork, london);
console.log('25% along:', interpolate(0.25));
console.log('50% along:', interpolate(0.5));
console.log('75% along:', interpolate(0.75));

// Calculate bounds
const bounds = d3.geoBounds(polygon);
console.log('Bounds [[west, south], [east, north]]:', bounds);
```

**Spherical vs. Planar**:
- Use `d3.geo*` for geographic coordinates (lat/lon)
- Use `d3.polygon*` for projected/screen coordinates

**References**:
- See: `docs/d3/geo/distance.md`
- See: `docs/d3/geo/area.md`
- See: `docs/d3/geo/centroid.md`

### Example 5: Custom Projection Configuration

**Question**: "How do I configure projection for a specific region?"

**Response**:
```javascript
import * as d3 from 'd3';

// Load region data (e.g., Europe)
const europe = await d3.json('europe.geojson');

// Method 1: Manual configuration
const projection1 = d3.geoMercator()
  .center([10, 50]) // Center on [lon, lat]
  .scale(500)
  .translate([400, 300]); // SVG center

// Method 2: Fit to bounds (recommended)
const projection2 = d3.geoMercator()
  .fitSize([800, 600], europe);

// Method 3: Fit with padding
const projection3 = d3.geoMercator()
  .fitExtent([[20, 20], [780, 580]], europe); // [[x0, y0], [x1, y1]]

// Method 4: Fit width, maintain aspect ratio
const projection4 = d3.geoMercator()
  .fitWidth(800, europe);

// Method 5: Fit height, maintain aspect ratio
const projection5 = d3.geoMercator()
  .fitHeight(600, europe);

// Projection with rotation
const projection6 = d3.geoMercator()
  .rotate([-10, 0, 0]) // [yaw, pitch, roll]
  .fitSize([800, 600], europe);

// Set clipping
const projection7 = d3.geoMercator()
  .clipAngle(90) // Clip to hemisphere
  .fitSize([800, 600], europe);

// Set precision (adaptive sampling)
const projection8 = d3.geoMercator()
  .precision(0.1) // Lower = more points, higher quality
  .fitSize([800, 600], europe);

// Get projection functions
const path = d3.geoPath(projection2);

// Project coordinate to screen
const [x, y] = projection2([10, 50]); // [lon, lat] -> [x, y]

// Invert screen to coordinate
const [lon, lat] = projection2.invert([400, 300]); // [x, y] -> [lon, lat]

// Check if coordinate is visible
const visible = projection2([10, 50]); // null if clipped
```

**Common Projections**:
- `geoMercator()` - Web maps (preserves angles)
- `geoAlbers()` - US/Europe maps (preserves area)
- `geoEquirectangular()` - Simple lat/lon mapping
- `geoConicEqualArea()` - Regional maps
- `geoNaturalEarth1()` - World maps (compromise)

**References**:
- See: `docs/d3/geo/projection.md`
- See: `docs/d3/geo-projection/`

## Common Patterns

### Zoom to Feature
```javascript
function zoomToFeature(feature) {
  const [[x0, y0], [x1, y1]] = path.bounds(feature);

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.min(8, 0.9 / Math.max(
        (x1 - x0) / width,
        (y1 - y0) / height
      )))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    );
}
```

### Highlight Neighbors
```javascript
const neighbors = topojson.neighbors(us.objects.states.geometries);

svg.selectAll('path')
  .on('mouseenter', function(event, d, i) {
    svg.selectAll('path')
      .filter((_, j) => neighbors[i].includes(j))
      .attr('fill', 'orange');
  });
```

### Add Labels to Centroids
```javascript
svg.selectAll('text')
  .data(countries.features)
  .join('text')
  .attr('transform', d => {
    const [x, y] = path.centroid(d);
    return `translate(${x}, ${y})`;
  })
  .attr('text-anchor', 'middle')
  .text(d => d.properties.name);
```

## Search Helpers

```bash
# Find projection docs
grep -r "projection\|geoMercator\|geoAlbers" ./docs/d3/geo-projection/

# Find path generator docs
grep -r "geoPath\|path.area\|path.bounds" ./docs/d3/geo/

# Find spherical math docs
grep -r "geoDistance\|geoArea\|geoCentroid" ./docs/d3/geo/

# Find clipping docs
grep -r "clip\|rotate" ./docs/d3/geo/

# List projection types
ls ./docs/d3/geo-projection/
```

## Common Errors

- **Map not centered**: Use .fitSize() instead of manual scale/translate
  - Solution: `projection.fitSize([width, height], geoJSON)`

- **Countries upside down**: Y coordinates in wrong direction
  - Solution: Ensure projection range is correct (already handled by D3)

- **Dateline artifacts**: Features crossing 180° longitude
  - Solution: Use antimeridian clipping or split features

- **Performance issues**: Too many vertices
  - Solution: Simplify TopoJSON with mapshaper or use .precision()

- **Projection returns null**: Coordinate outside clip bounds
  - Solution: Check .clipAngle() or handle null values

## Performance Tips

1. **Use TopoJSON** - Smaller file size, shared boundaries
2. **Simplify geometries** - Use mapshaper or topojson-simplify
3. **Set appropriate precision** - Balance quality vs. speed
4. **Cache path generator** - Reuse for all features
5. **Use canvas rendering** - For large/complex maps
6. **Limit feature count** - Filter or aggregate for interactive maps

## Notes

- Documentation covers D3 v7 (latest version)
- All projections support .fitSize(), .fitExtent(), .fitWidth(), .fitHeight()
- Orthographic projection shows one hemisphere at a time
- AlbersUsa is composite projection (mainland + Alaska + Hawaii)
- GeoJSON uses [longitude, latitude] order (not lat/lon!)
- Spherical calculations use radians (multiply by Earth radius for km)
- TopoJSON is more efficient than GeoJSON for maps
- File paths reference local documentation cache
- For latest updates, check https://d3js.org/d3-geo
