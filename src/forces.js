import * as d3 from 'd3';

export function applyYearForces(graph, nodes) {
  if (!graph || typeof graph.d3Force !== 'function') return;
  //const years = [...new Set(nodes.map(n => n.group))];
  graph
    //.d3Force('x', d3.forceX(node => years.indexOf(node.group) * 200))
    //.d3Force('y', d3.forceY(() => Math.random() * 400 - 200))
    //.d3Force('z', d3.forceZ(() => Math.random() * 400 - 200))
    .d3Force('center', d3.forceCenter(0, 0, 0))
    .d3Force('charge').strength(-20)
   // .d3Force('link').distance(200);
}