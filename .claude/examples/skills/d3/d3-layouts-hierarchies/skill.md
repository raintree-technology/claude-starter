---
name: d3-layouts-hierarchies
description: Use when creating tree diagrams, force-directed networks, Voronoi diagrams, or hierarchical layouts. Invoke for org charts, node-link diagrams, treemaps, dendrograms, force simulations, spatial indexing, or network visualizations.
allowed-tools: Read, Grep, Glob
---

# D3 Layouts & Hierarchies Expert

## Purpose

Expert knowledge of D3's layout algorithms and hierarchical data structures. Covers tree layouts, force-directed graphs, Voronoi diagrams, Delaunay triangulation, quadtrees, and spatial indexing.

## When to Use

Invoke this skill when:
- Creating tree diagrams or org charts
- Building force-directed network graphs
- Generating treemaps or circle packing
- Creating dendrograms or phylogenetic trees
- Working with Voronoi diagrams or tessellation
- Implementing Delaunay triangulation
- Building spatial indexes with quadtrees
- Creating sunburst or icicle charts
- Simulating particle systems
- Debugging layout or positioning issues

## Documentation Available

**Location**: `./docs/d3/`

**Coverage** (177 files):
- **Hierarchy** (62 files):
  - Tree layouts: tree, cluster
  - Space-filling: treemap, partition, pack
  - Bundling: bundle
  - Hierarchy data structure and methods
  - Sorting, filtering, paths, ancestors

- **Force Simulation** (47 files):
  - Force-directed layout
  - Forces: center, collision, links, many-body, X, Y, radial
  - Simulation control and optimization
  - Custom forces

- **Delaunay/Voronoi** (31 files from delaunay):
  - Delaunay triangulation
  - Voronoi diagrams
  - Nearest neighbor queries
  - Circumcircles and hull

- **Quadtree** (17 files):
  - Spatial indexing
  - Nearest neighbor search
  - Range queries
  - Collision detection

- **Voronoi (legacy)** (18 files):
  - Legacy voronoi implementation
  - Polygon generation

## Related Skills

- **d3-shapes-paths**: For rendering tree links and node shapes
- **d3-core-data**: For hierarchical data transformations
- **d3-interaction-animation**: For animated layouts
- **d3-geo**: For geographic network visualization

## Best Practices

- **Normalize hierarchy data** - Use d3.hierarchy() to create structure
- **Set appropriate force strengths** - Balance forces for stable layouts
- **Use collision detection** - Prevent node overlap in force layouts
- **Optimize simulation** - Set alpha decay for convergence
- **Use quadtrees for performance** - For spatial queries in large datasets
- **Set tree separation** - Control spacing in tree layouts
- **Handle dynamic updates** - Reheat simulation for new nodes
- **Use canvas for large graphs** - SVG performance degrades with many nodes
- **Cache layouts** - Recompute only when data changes

## Examples

### Example 1: Tree Layout (Org Chart)

**Question**: "How do I create an organization chart with D3?"

**Response**:
```javascript
import * as d3 from 'd3';

// Sample hierarchical data
const data = {
  name: 'CEO',
  children: [
    {
      name: 'VP Engineering',
      children: [
        { name: 'Dev Lead', children: [
          { name: 'Engineer 1' },
          { name: 'Engineer 2' },
        ]},
        { name: 'QA Lead' },
      ],
    },
    {
      name: 'VP Sales',
      children: [
        { name: 'Sales Rep 1' },
        { name: 'Sales Rep 2' },
      ],
    },
  ],
};

// Create hierarchy
const root = d3.hierarchy(data);

// Create tree layout
const treeLayout = d3.tree()
  .size([800, 400]) // Width, height
  .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

// Compute positions
treeLayout(root);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 500);

const g = svg.append('g')
  .attr('transform', 'translate(0, 50)');

// Draw links
g.selectAll('.link')
  .data(root.links())
  .join('path')
  .attr('class', 'link')
  .attr('d', d3.linkVertical()
    .x(d => d.x)
    .y(d => d.y)
  )
  .attr('fill', 'none')
  .attr('stroke', '#ccc')
  .attr('stroke-width', 2);

// Draw nodes
const node = g.selectAll('.node')
  .data(root.descendants())
  .join('g')
  .attr('class', 'node')
  .attr('transform', d => `translate(${d.x}, ${d.y})`);

node.append('circle')
  .attr('r', 5)
  .attr('fill', d => d.children ? '#555' : '#999');

node.append('text')
  .attr('dy', -10)
  .attr('text-anchor', 'middle')
  .text(d => d.data.name)
  .style('font-size', '12px');

// Access hierarchy methods
console.log('Root node:', root);
console.log('Leaves:', root.leaves()); // Nodes without children
console.log('Links:', root.links()); // All parent-child links
console.log('Depth:', root.height); // Maximum depth
console.log('Descendants:', root.descendants()); // All nodes
console.log('Ancestors of leaf:', root.leaves()[0].ancestors()); // Path to root
```

**Horizontal Tree** (swap x and y):
```javascript
const treeLayout = d3.tree()
  .size([400, 800]);

// Use linkHorizontal for links
const link = d3.linkHorizontal()
  .x(d => d.y)
  .y(d => d.x);
```

**References**:
- See: `docs/d3/hierarchy/tree.md`
- See: `docs/d3/hierarchy/hierarchy.md`

### Example 2: Force-Directed Network Graph

**Question**: "How do I create an interactive force-directed graph?"

**Response**:
```javascript
import * as d3 from 'd3';

// Sample network data
const data = {
  nodes: [
    { id: 'A', group: 1 },
    { id: 'B', group: 1 },
    { id: 'C', group: 2 },
    { id: 'D', group: 2 },
    { id: 'E', group: 3 },
  ],
  links: [
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'C', target: 'D' },
    { source: 'D', target: 'E' },
  ],
};

// Create SVG
const width = 800;
const height = 600;
const svg = d3.create('svg')
  .attr('width', width)
  .attr('height', height);

// Create force simulation
const simulation = d3.forceSimulation(data.nodes)
  .force('link', d3.forceLink(data.links)
    .id(d => d.id)
    .distance(100) // Link length
  )
  .force('charge', d3.forceManyBody()
    .strength(-300) // Repulsion between nodes
  )
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(20) // Prevent overlap
  );

// Create color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Draw links
const link = svg.append('g')
  .selectAll('line')
  .data(data.links)
  .join('line')
  .attr('stroke', '#999')
  .attr('stroke-width', 2)
  .attr('stroke-opacity', 0.6);

// Draw nodes
const node = svg.append('g')
  .selectAll('circle')
  .data(data.nodes)
  .join('circle')
  .attr('r', 10)
  .attr('fill', d => color(d.group))
  .attr('stroke', '#fff')
  .attr('stroke-width', 2);

// Add labels
const label = svg.append('g')
  .selectAll('text')
  .data(data.nodes)
  .join('text')
  .text(d => d.id)
  .attr('font-size', 12)
  .attr('dx', 12)
  .attr('dy', 4);

// Add drag behavior
const drag = d3.drag()
  .on('start', (event, d) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (event, d) => {
    d.fx = event.x;
    d.fy = event.y;
  })
  .on('end', (event, d) => {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  });

node.call(drag);

// Update positions on each tick
simulation.on('tick', () => {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  node
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

  label
    .attr('x', d => d.x)
    .attr('y', d => d.y);
});

// Stop simulation after convergence
simulation.on('end', () => {
  console.log('Simulation converged');
});
```

**Custom Force** (e.g., bounding box):
```javascript
function boundingBoxForce() {
  const margin = 20;

  function force() {
    data.nodes.forEach(node => {
      node.x = Math.max(margin, Math.min(width - margin, node.x));
      node.y = Math.max(margin, Math.min(height - margin, node.y));
    });
  }

  return force;
}

simulation.force('bounds', boundingBoxForce());
```

**References**:
- See: `docs/d3/force/simulation.md`
- See: `docs/d3/force/forces.md`

### Example 3: Treemap (Hierarchical Space-Filling)

**Question**: "How do I create a treemap for file sizes?"

**Response**:
```javascript
import * as d3 from 'd3';

// Sample hierarchical data
const data = {
  name: 'root',
  children: [
    {
      name: 'src',
      children: [
        { name: 'app.js', value: 1200 },
        { name: 'utils.js', value: 800 },
      ],
    },
    {
      name: 'assets',
      children: [
        { name: 'logo.png', value: 2400 },
        { name: 'bg.jpg', value: 3500 },
      ],
    },
    {
      name: 'docs',
      children: [
        { name: 'readme.md', value: 500 },
      ],
    },
  ],
};

// Create hierarchy and sum values
const root = d3.hierarchy(data)
  .sum(d => d.value) // Compute value for each node
  .sort((a, b) => b.value - a.value); // Sort by size

// Create treemap layout
const treemap = d3.treemap()
  .size([800, 600])
  .padding(2) // Space between cells
  .round(true);

// Compute layout
treemap(root);

// Create color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw cells
const cell = svg.selectAll('g')
  .data(root.leaves()) // Only leaf nodes
  .join('g')
  .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

cell.append('rect')
  .attr('width', d => d.x1 - d.x0)
  .attr('height', d => d.y1 - d.y0)
  .attr('fill', d => color(d.parent.data.name))
  .attr('opacity', 0.6)
  .attr('stroke', '#fff');

// Add labels
cell.append('text')
  .attr('x', 4)
  .attr('y', 16)
  .text(d => d.data.name)
  .attr('font-size', 10)
  .attr('fill', 'black');

// Add size labels
cell.append('text')
  .attr('x', 4)
  .attr('y', 28)
  .text(d => d3.format('.2s')(d.value))
  .attr('font-size', 9)
  .attr('fill', '#666');
```

**Treemap Tiling Algorithms**:
```javascript
treemap.tile(d3.treemapBinary); // Binary tree
treemap.tile(d3.treemapSquarify); // Square aspect ratio (default)
treemap.tile(d3.treemapSlice); // Horizontal slices
treemap.tile(d3.treemapDice); // Vertical slices
treemap.tile(d3.treemapSliceDice); // Alternating
```

**References**:
- See: `docs/d3/hierarchy/treemap.md`

### Example 4: Voronoi Diagram

**Question**: "How do I create a Voronoi diagram for nearest neighbor?"

**Response**:
```javascript
import * as d3 from 'd3';

// Random points
const points = Array.from({ length: 50 }, () => ({
  x: Math.random() * 800,
  y: Math.random() * 600,
}));

// Create Delaunay triangulation
const delaunay = d3.Delaunay.from(points, d => d.x, d => d.y);

// Create Voronoi diagram
const voronoi = delaunay.voronoi([0, 0, 800, 600]); // [xmin, ymin, xmax, ymax]

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw Voronoi cells
svg.append('g')
  .selectAll('path')
  .data(points)
  .join('path')
  .attr('d', (d, i) => voronoi.renderCell(i))
  .attr('fill', 'none')
  .attr('stroke', '#ccc');

// Draw Delaunay triangulation (optional)
svg.append('path')
  .attr('d', delaunay.render())
  .attr('fill', 'none')
  .attr('stroke', 'blue')
  .attr('opacity', 0.2);

// Draw points
svg.append('g')
  .selectAll('circle')
  .data(points)
  .join('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', 3)
  .attr('fill', 'red');

// Find nearest point on click
svg.on('click', (event) => {
  const [mx, my] = d3.pointer(event);
  const nearestIndex = delaunay.find(mx, my);
  const nearest = points[nearestIndex];

  console.log('Nearest point:', nearest);

  // Highlight nearest cell
  svg.selectAll('.highlight').remove();
  svg.append('path')
    .attr('class', 'highlight')
    .attr('d', voronoi.renderCell(nearestIndex))
    .attr('fill', 'yellow')
    .attr('opacity', 0.5)
    .attr('stroke', 'red')
    .attr('stroke-width', 2);
});

// Find all neighbors of a point
const neighbors = [...delaunay.neighbors(0)]; // Neighbors of point 0
console.log('Neighbors of point 0:', neighbors);

// Compute circumcenters
const circumcenters = Array.from(delaunay.triangles, (_, i) => {
  if (i % 3 === 0) {
    return delaunay.circumcenters.slice(i * 2 / 3, i * 2 / 3 + 2);
  }
}).filter(Boolean);
```

**Delaunay Methods**:
- `.find(x, y)` - Find nearest point
- `.neighbors(i)` - Get neighboring points
- `.render()` - Render triangulation as SVG path
- `.renderHull()` - Render convex hull

**Voronoi Methods**:
- `.renderCell(i)` - Render cell as SVG path
- `.cellPolygon(i)` - Get cell vertices
- `.contains(i, x, y)` - Test if point in cell

**References**:
- See: `docs/d3/delaunay/`

### Example 5: Circle Packing

**Question**: "How do I create a circle packing layout?"

**Response**:
```javascript
import * as d3 from 'd3';

const data = {
  name: 'root',
  children: [
    {
      name: 'Category A',
      children: [
        { name: 'Item 1', value: 100 },
        { name: 'Item 2', value: 200 },
        { name: 'Item 3', value: 150 },
      ],
    },
    {
      name: 'Category B',
      children: [
        { name: 'Item 4', value: 300 },
        { name: 'Item 5', value: 250 },
      ],
    },
  ],
};

// Create hierarchy
const root = d3.hierarchy(data)
  .sum(d => d.value)
  .sort((a, b) => b.value - a.value);

// Create pack layout
const pack = d3.pack()
  .size([800, 600])
  .padding(3);

// Compute layout
pack(root);

// Create color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw circles
const node = svg.selectAll('g')
  .data(root.descendants())
  .join('g')
  .attr('transform', d => `translate(${d.x}, ${d.y})`);

node.append('circle')
  .attr('r', d => d.r)
  .attr('fill', d => d.children ? 'none' : color(d.parent.data.name))
  .attr('opacity', d => d.children ? 0 : 0.6)
  .attr('stroke', d => d.children ? '#ccc' : '#fff')
  .attr('stroke-width', d => d.children ? 2 : 1);

// Add labels
node.append('text')
  .attr('text-anchor', 'middle')
  .attr('dy', '0.3em')
  .text(d => d.children ? d.data.name : '')
  .attr('font-size', d => Math.min(d.r / 3, 16))
  .attr('fill', '#666');

// Add zoom on click
node.on('click', (event, d) => {
  if (!d.children) return;

  const focus = d;
  const k = 800 / (focus.r * 2 + 1);

  svg.transition()
    .duration(750)
    .attr('viewBox', `${focus.x - focus.r} ${focus.y - focus.r} ${focus.r * 2} ${focus.r * 2}`);
});
```

**Zoomable Sunburst** (radial partition):
```javascript
const partition = d3.partition()
  .size([2 * Math.PI, radius]);

const arc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => d.y0)
  .outerRadius(d => d.y1);
```

**References**:
- See: `docs/d3/hierarchy/pack.md`
- See: `docs/d3/hierarchy/partition.md`

## Common Patterns

### Filter Hierarchy
```javascript
const filtered = root.copy()
  .each(d => d.children && d.children.filter(c => c.value > 100));
```

### Find Path Between Nodes
```javascript
function findPath(node1, node2) {
  const ancestors1 = node1.ancestors();
  const ancestors2 = node2.ancestors();
  const common = ancestors1.find(a => ancestors2.includes(a));
  return [...node1.path(common), ...node2.path(common).reverse()];
}
```

### Reheat Force Simulation
```javascript
simulation.alpha(1).restart(); // Add new nodes
```

### Spatial Query with Quadtree
```javascript
const quadtree = d3.quadtree()
  .x(d => d.x)
  .y(d => d.y)
  .addAll(points);

// Find points in radius
const nearby = [];
quadtree.visit((node, x0, y0, x1, y1) => {
  if (!node.length) {
    do {
      const d = node.data;
      const dx = d.x - mx;
      const dy = d.y - my;
      if (dx * dx + dy * dy < radius * radius) {
        nearby.push(d);
      }
    } while (node = node.next);
  }
  return x0 > mx + radius || y0 > my + radius || x1 < mx - radius || y1 < my - radius;
});
```

## Search Helpers

```bash
# Find hierarchy docs
grep -r "hierarchy\|tree\|treemap\|pack" ./docs/d3/hierarchy/

# Find force docs
grep -r "force\|simulation\|forceLink" ./docs/d3/force/

# Find Delaunay/Voronoi docs
grep -r "delaunay\|voronoi\|triangulation" ./docs/d3/delaunay/

# Find quadtree docs
grep -r "quadtree\|spatial" ./docs/d3/quadtree/

# List layout modules
ls ./docs/d3/hierarchy/
ls ./docs/d3/force/
```

## Common Errors

- **Force simulation not converging**: Alpha decay too fast
  - Solution: Increase alphaDecay or set alphaTarget

- **Nodes overlap**: No collision force
  - Solution: Add `.force('collision', d3.forceCollide().radius(r))`

- **Tree layout cramped**: Insufficient separation
  - Solution: Adjust `.separation()` function

- **Treemap cells too small**: Need minimum size
  - Solution: Filter data or use `.paddingInner()` for spacing

- **Voronoi artifacts at edges**: Bounds not set
  - Solution: Set proper bounds in `.voronoi([x0, y0, x1, y1])`

## Performance Tips

1. **Use Canvas for large graphs** - 1000+ nodes perform better in Canvas
2. **Limit force iterations** - Set `.alphaMin()` higher for faster convergence
3. **Use quadtrees for collision** - O(n log n) instead of O(n²)
4. **Simplify hierarchy** - Prune deep or wide trees
5. **Cache layout results** - Don't recompute on every render
6. **Use Web Workers** - Offload force simulation to worker thread

## Notes

- Documentation covers D3 v7 (latest version)
- Force simulation uses velocity Verlet integration
- Delaunay is faster and more robust than legacy Voronoi
- Quadtrees are 2D R-trees for spatial indexing
- Hierarchy methods are chainable and immutable
- Force simulation runs asynchronously
- Treemap tiling affects aspect ratio and readability
- File paths reference local documentation cache
- For latest updates, check https://d3js.org/d3-hierarchy
