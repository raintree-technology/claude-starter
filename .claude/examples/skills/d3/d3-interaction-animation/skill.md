---
name: d3-interaction-animation
description: Use when creating interactive visualizations with transitions, animations, drag/zoom/brush behaviors, or DOM manipulation. Invoke for data binding with .join(), animated transitions, interactive behaviors, user input handling, or selection operations.
allowed-tools: Read, Grep, Glob
---

# D3 Interaction & Animation Expert

## Purpose

Expert knowledge of D3's DOM manipulation, data binding, transitions, and interactive behaviors. Covers selections, data joins, transitions, easing, drag, zoom, brush, timers, and event handling.

## When to Use

Invoke this skill when:
- Binding data to DOM elements with .data() or .join()
- Creating smooth transitions and animations
- Implementing drag-and-drop interactions
- Adding pan and zoom behaviors
- Creating brush selections for filtering
- Working with time-based animations
- Handling user input events
- Debugging data binding or transition issues
- Optimizing animation performance
- Creating interactive dashboards

## Documentation Available

**Location**: `./docs/d3/`

**Coverage** (280 files):
- **Selections** (55 files):
  - Selecting elements (select, selectAll)
  - Data binding (data, join, enter, exit, update)
  - Modifying elements (attr, style, text, html)
  - Event handling (on, dispatch)
  - Namespaces and utilities

- **Transitions** (34 files):
  - Creating transitions
  - Transition timing and duration
  - Chaining and delays
  - Attribute interpolation
  - Custom tweens

- **Easing** (34 files):
  - Easing functions (linear, quad, cubic, elastic, bounce)
  - Custom easing
  - Polynomial easings

- **Interpolation** (30 files):
  - Number, color, string interpolation
  - Array, object interpolation
  - Custom interpolators

- **Drag** (12 files):
  - Drag behavior
  - Drag events (start, drag, end)
  - Drag subjects and containers

- **Zoom** (34 files):
  - Zoom behavior
  - Pan and zoom transforms
  - Zoom constraints
  - Programmatic zoom

- **Brush** (14 files):
  - 1D and 2D brush selections
  - Brush events and extent
  - Programmatic brushing

- **Timer** (8 files):
  - Timer API
  - Animation loops
  - Timeout and interval

- **Time** (45 files):
  - Time intervals (second, minute, hour, day, week, month, year)
  - Time ranges and arithmetic
  - Time scales

- **Time Format** (13 files):
  - Date formatting and parsing
  - Locale-aware formatting

## Related Skills

- **d3-shapes-paths**: For animating shapes and paths
- **d3-core-data**: For data transformations before binding
- **d3-layouts-hierarchies**: For interactive force graphs
- **d3-geo**: For interactive maps

## Best Practices

- **Use .join() for data binding** - Handles enter/update/exit in one call
- **Chain transitions** - Use .transition().transition() for sequences
- **Set transition keys** - Use .transition(name) for independent transitions
- **Prefer attr() over direct DOM** - Maintains D3's internal state
- **Debounce expensive operations** - Throttle zoom/pan handlers
- **Use delegation for events** - More efficient than per-element handlers
- **Cancel transitions on interaction** - Call .interrupt() before new transitions
- **Use transform for positioning** - Faster than changing x/y attributes
- **Optimize selection queries** - Cache selections when possible

## Examples

### Example 1: Data Join with .join()

**Question**: "How do I bind data to DOM elements with D3?"

**Response**:
```javascript
import * as d3 from 'd3';

// Sample data
let data = [
  { id: 1, value: 30, color: 'red' },
  { id: 2, value: 80, color: 'blue' },
  { id: 3, value: 45, color: 'green' },
];

// Create SVG
const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

// Initial render
function update(data) {
  const circles = svg.selectAll('circle')
    .data(data, d => d.id) // Key function for object constancy
    .join(
      // Enter: new elements
      enter => enter.append('circle')
        .attr('cx', (d, i) => i * 100 + 50)
        .attr('cy', 200)
        .attr('r', 0) // Start small
        .attr('fill', d => d.color)
        .call(enter => enter.transition()
          .duration(500)
          .attr('r', d => d.value / 2)
        ),

      // Update: existing elements
      update => update
        .call(update => update.transition()
          .duration(500)
          .attr('r', d => d.value / 2)
          .attr('fill', d => d.color)
        ),

      // Exit: removed elements
      exit => exit
        .call(exit => exit.transition()
          .duration(500)
          .attr('r', 0)
          .remove()
        )
    );
}

// Initial render
update(data);

// Update after 2 seconds
setTimeout(() => {
  data = [
    { id: 1, value: 50, color: 'red' },    // Updated
    { id: 3, value: 60, color: 'yellow' }, // Updated
    { id: 4, value: 70, color: 'purple' }, // New
  ];
  update(data);
}, 2000);
```

**Simple .join()** (default behavior):
```javascript
svg.selectAll('circle')
  .data(data)
  .join('circle') // Handles enter/update/exit automatically
  .attr('cx', (d, i) => i * 100 + 50)
  .attr('cy', 200)
  .attr('r', d => d.value / 2)
  .attr('fill', d => d.color);
```

**Old-style enter/update/exit** (verbose):
```javascript
const circles = svg.selectAll('circle')
  .data(data);

// Enter
circles.enter().append('circle')
  .attr('r', 0)
  .merge(circles) // Merge with update selection
  .attr('cx', (d, i) => i * 100 + 50)
  .attr('cy', 200)
  .transition()
  .attr('r', d => d.value / 2);

// Exit
circles.exit().remove();
```

**References**:
- See: `docs/d3/selection/join.md`
- See: `docs/d3/selection/data.md`

### Example 2: Smooth Transitions with Easing

**Question**: "How do I create smooth animated transitions?"

**Response**:
```javascript
import * as d3 from 'd3';

const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 400);

const circle = svg.append('circle')
  .attr('cx', 50)
  .attr('cy', 200)
  .attr('r', 20)
  .attr('fill', 'steelblue');

// Basic transition
circle.transition()
  .duration(2000)
  .attr('cx', 750);

// Transition with easing
circle.transition()
  .duration(2000)
  .ease(d3.easeCubicInOut) // Smooth acceleration/deceleration
  .attr('cx', 750);

// Chained transitions
circle.transition()
  .duration(1000)
  .ease(d3.easeElasticOut) // Bounce effect
  .attr('cy', 100)
  .transition() // Chain next transition
  .duration(1000)
  .ease(d3.easeBounceOut)
  .attr('cy', 300);

// Transition with delay
circle.transition()
  .delay(500)
  .duration(1000)
  .attr('r', 40);

// Staggered transitions
svg.selectAll('circle')
  .data([1, 2, 3, 4, 5])
  .join('circle')
  .attr('cx', (d, i) => i * 100 + 50)
  .attr('cy', 200)
  .attr('r', 0)
  .transition()
  .delay((d, i) => i * 100) // Stagger by 100ms
  .duration(500)
  .attr('r', 20);

// Named transitions (independent)
circle.transition('move')
  .duration(2000)
  .attr('cx', 750);

circle.transition('grow') // Runs simultaneously
  .duration(1000)
  .attr('r', 40);

// Custom tween
circle.transition()
  .duration(2000)
  .attrTween('r', function() {
    const i = d3.interpolate(20, 60);
    return t => i(Math.sin(t * Math.PI)); // Pulse in and out
  });

// Transition events
circle.transition()
  .duration(1000)
  .attr('cx', 750)
  .on('start', function() { console.log('Started'); })
  .on('interrupt', function() { console.log('Interrupted'); })
  .on('end', function() { console.log('Ended'); });

// Cancel transition
circle.interrupt(); // Stop current transition
```

**Common Easing Functions**:
- `easeLinear` - Constant speed
- `easeCubicInOut` - Smooth start and end
- `easeElasticOut` - Bounce/spring effect
- `easeBounceOut` - Bouncing ball
- `easeExpOut` - Exponential decay
- `easeBackOut` - Overshoot and settle

**References**:
- See: `docs/d3/transition/`
- See: `docs/d3/ease/`

### Example 3: Drag Behavior

**Question**: "How do I implement drag-and-drop?"

**Response**:
```javascript
import * as d3 from 'd3';

const svg = d3.create('svg')
  .attr('width', 800)
  .attr('height', 600);

// Sample data
const nodes = [
  { x: 100, y: 100, r: 30, color: 'red' },
  { x: 200, y: 150, r: 40, color: 'blue' },
  { x: 300, y: 200, r: 25, color: 'green' },
];

// Create drag behavior
const drag = d3.drag()
  .on('start', function(event, d) {
    d3.select(this)
      .raise() // Move to front
      .attr('stroke', 'black')
      .attr('stroke-width', 3);
  })
  .on('drag', function(event, d) {
    // Update data
    d.x = event.x;
    d.y = event.y;

    // Update position
    d3.select(this)
      .attr('cx', d.x)
      .attr('cy', d.y);
  })
  .on('end', function(event, d) {
    d3.select(this)
      .attr('stroke', null);
  });

// Draw circles
const circles = svg.selectAll('circle')
  .data(nodes)
  .join('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', d => d.r)
  .attr('fill', d => d.color)
  .call(drag); // Apply drag behavior

// Constrained drag (stay in bounds)
const constrainedDrag = d3.drag()
  .on('drag', function(event, d) {
    const r = d.r;
    d.x = Math.max(r, Math.min(800 - r, event.x));
    d.y = Math.max(r, Math.min(600 - r, event.y));

    d3.select(this)
      .attr('cx', d.x)
      .attr('cy', d.y);
  });

// Drag with container constraint
const containerDrag = d3.drag()
  .container(function() {
    return this.parentNode; // Use parent as coordinate system
  })
  .on('drag', function(event, d) {
    d3.select(this)
      .attr('cx', event.x)
      .attr('cy', event.y);
  });

// Drag subject (custom hit detection)
const customDrag = d3.drag()
  .subject(function(event) {
    // Find closest node within 50px
    const [mx, my] = d3.pointer(event);
    let closest = null;
    let minDist = 50;

    nodes.forEach(node => {
      const dx = node.x - mx;
      const dy = node.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        closest = node;
        minDist = dist;
      }
    });

    return closest;
  })
  .on('drag', function(event) {
    if (event.subject) {
      event.subject.x = event.x;
      event.subject.y = event.y;
      updateCircles();
    }
  });

function updateCircles() {
  svg.selectAll('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);
}
```

**References**:
- See: `docs/d3/drag/`

### Example 4: Zoom and Pan

**Question**: "How do I add zoom and pan to a visualization?"

**Response**:
```javascript
import * as d3 from 'd3';

const width = 800;
const height = 600;

const svg = d3.create('svg')
  .attr('width', width)
  .attr('height', height);

// Create group for zoomable content
const g = svg.append('g');

// Sample data
const circles = Array.from({ length: 50 }, (_, i) => ({
  x: Math.random() * width,
  y: Math.random() * height,
  r: Math.random() * 20 + 5,
}));

// Draw circles
g.selectAll('circle')
  .data(circles)
  .join('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', d => d.r)
  .attr('fill', 'steelblue')
  .attr('opacity', 0.6);

// Create zoom behavior
const zoom = d3.zoom()
  .scaleExtent([0.5, 10]) // Min and max zoom
  .translateExtent([[0, 0], [width, height]]) // Pan bounds
  .on('zoom', (event) => {
    // Apply transform to group
    g.attr('transform', event.transform);
  });

// Apply zoom to SVG
svg.call(zoom);

// Programmatic zoom
function zoomToArea(x, y, width, height) {
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity
      .translate(400, 300)
      .scale(Math.min(8, 0.9 / Math.max(width / 800, height / 600)))
      .translate(-x - width / 2, -y - height / 2)
    );
}

// Reset zoom
function resetZoom() {
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
}

// Zoom to fit all circles
function zoomToFit() {
  const bounds = g.node().getBBox();
  const fullWidth = bounds.width;
  const fullHeight = bounds.height;
  const midX = bounds.x + fullWidth / 2;
  const midY = bounds.y + fullHeight / 2;

  const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
  const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale)
    );
}

// Zoom on double-click
svg.on('dblclick.zoom', null); // Disable default behavior
svg.on('dblclick', function(event) {
  const [x, y] = d3.pointer(event);
  svg.transition()
    .duration(500)
    .call(zoom.scaleBy, 2, [x, y]); // Zoom in 2x at cursor
});

// Zoom with mouse wheel only (disable pan)
const wheelZoom = d3.zoom()
  .filter(event => event.type === 'wheel')
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  });

// Constrain zoom to semantic zoom (update data, not transform)
const semanticZoom = d3.zoom()
  .on('zoom', (event) => {
    const newRadius = d => d.r * event.transform.k;
    g.selectAll('circle')
      .attr('r', newRadius);
  });
```

**Zoom Events**:
- `zoom.transform` - Current transform
- `zoom.scaleBy(k)` - Zoom by factor k
- `zoom.scaleTo(k)` - Zoom to scale k
- `zoom.translateBy(x, y)` - Pan by [x, y]
- `zoom.translateTo(x, y)` - Pan to [x, y]

**References**:
- See: `docs/d3/zoom/`

### Example 5: Brush Selection

**Question**: "How do I create a brush for filtering data?"

**Response**:
```javascript
import * as d3 from 'd3';

const width = 800;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

// Sample data
const data = Array.from({ length: 100 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

// Create scales
const xScale = d3.scaleLinear()
  .domain([0, 100])
  .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([height - margin.bottom, margin.top]);

// Create SVG
const svg = d3.create('svg')
  .attr('width', width)
  .attr('height', height);

// Draw points
const circles = svg.append('g')
  .selectAll('circle')
  .data(data)
  .join('circle')
  .attr('cx', d => xScale(d.x))
  .attr('cy', d => yScale(d.y))
  .attr('r', 4)
  .attr('fill', 'steelblue')
  .attr('opacity', 0.6);

// Create 2D brush
const brush = d3.brush()
  .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
  .on('start brush end', function(event) {
    if (!event.selection) {
      // No selection - reset
      circles.attr('fill', 'steelblue').attr('opacity', 0.6);
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection;

    // Highlight selected points
    circles.attr('fill', d => {
      const cx = xScale(d.x);
      const cy = yScale(d.y);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
        ? 'red'
        : 'steelblue';
    })
    .attr('opacity', d => {
      const cx = xScale(d.x);
      const cy = yScale(d.y);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
        ? 1
        : 0.2;
    });

    // Get selected data
    const selected = data.filter(d => {
      const cx = xScale(d.x);
      const cy = yScale(d.y);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    });

    console.log(`Selected ${selected.length} points`);
  });

// Add brush to SVG
svg.append('g')
  .attr('class', 'brush')
  .call(brush);

// 1D brush (for timeline or axis)
const xBrush = d3.brushX()
  .extent([[margin.left, 0], [width - margin.right, 50]])
  .on('brush', (event) => {
    if (event.selection) {
      const [x0, x1] = event.selection.map(xScale.invert);
      console.log('Selected range:', x0, x1);
    }
  });

// Programmatic brush
function selectArea(x0, y0, x1, y1) {
  svg.select('.brush')
    .call(brush.move, [[x0, y0], [x1, y1]]);
}

// Clear brush
function clearBrush() {
  svg.select('.brush')
    .call(brush.move, null);
}

// Brush with snap-to-grid
const gridBrush = d3.brush()
  .on('end', function(event) {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection;
    const snapped = [
      [Math.round(x0 / 10) * 10, Math.round(y0 / 10) * 10],
      [Math.round(x1 / 10) * 10, Math.round(y1 / 10) * 10],
    ];

    d3.select(this).call(brush.move, snapped);
  });
```

**Brush Types**:
- `brush()` - 2D brush (x and y)
- `brushX()` - 1D horizontal brush
- `brushY()` - 1D vertical brush

**References**:
- See: `docs/d3/brush/`

## Common Patterns

### Responsive Data Join
```javascript
function render(data) {
  const bars = svg.selectAll('rect')
    .data(data, d => d.id)
    .join('rect')
    .attr('x', (d, i) => i * 50)
    .attr('y', d => height - d.value)
    .attr('width', 40)
    .attr('height', d => d.value)
    .attr('fill', 'steelblue');
}
```

### Coordinated Transitions
```javascript
const t = svg.transition().duration(750);

circles.transition(t).attr('r', 20);
lines.transition(t).attr('stroke-width', 3);
```

### Event Delegation
```javascript
svg.on('click', function(event) {
  const element = event.target;
  if (element.tagName === 'circle') {
    console.log('Circle clicked:', d3.select(element).datum());
  }
});
```

## Search Helpers

```bash
# Find selection docs
grep -r "select\|selectAll\|join\|data" ./docs/d3/selection/

# Find transition docs
grep -r "transition\|duration\|ease" ./docs/d3/transition/

# Find interaction docs
grep -r "drag\|zoom\|brush" ./docs/d3/drag/ ./docs/d3/zoom/ ./docs/d3/brush/

# Find timer docs
grep -r "timer\|timeout\|interval" ./docs/d3/timer/

# List interaction modules
ls ./docs/d3/selection/
ls ./docs/d3/transition/
```

## Common Errors

- **Data not updating**: Forgot to use key function
  - Solution: `.data(data, d => d.id)`

- **Transition not smooth**: Wrong easing function
  - Solution: Use `easeCubicInOut` for smooth start/end

- **Drag not working**: Event propagation stopped
  - Solution: Check `.call(drag)` is applied correctly

- **Zoom jumps**: Transform state out of sync
  - Solution: Use `zoom.transform` to get/set state

- **Brush not visible**: Missing CSS or wrong extent
  - Solution: Add default brush styles or check extent bounds

## Performance Tips

1. **Use transform for positioning** - Faster than x/y attributes
2. **Batch updates** - Update multiple attributes in one call
3. **Cache selections** - Don't re-select repeatedly
4. **Use CSS for static styles** - Faster than .style()
5. **Interrupt transitions** - Cancel before starting new ones
6. **Throttle event handlers** - Debounce zoom/pan/brush
7. **Use Canvas for large datasets** - 10,000+ elements
8. **Avoid layout thrashing** - Read then write DOM properties

## Notes

- Documentation covers D3 v7 (latest version)
- .join() is recommended over enter/update/exit pattern
- Transitions are asynchronous and can be chained
- Drag/zoom/brush behaviors are reusable functions
- Key functions enable object constancy in transitions
- Named transitions run independently
- Transform is CSS transform string (translate, scale, rotate)
- File paths reference local documentation cache
- For latest updates, check https://d3js.org/d3-selection
