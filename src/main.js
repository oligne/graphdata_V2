import { loadData, filterNodesAndLinks } from './data.js';
import { createGraph, updateGraphData } from './graph.js';
import { setupUI } from './ui.js';
import { applyYearForces } from './forces.js';


let graph, fullGraph, nodes = [], links = [];
let folderLinksActive = true;

function setFolderLinksActive(val) {
  folderLinksActive = val;
  updateGraph();
}

loadData('./data.json').then(data => {
  fullGraph = data;
  graph = createGraph(document.getElementById('3d-graph'));
  setupUI({ graph, fullGraph,updateGraph, setFolderLinksActive, getFolderLinksActive: () => folderLinksActive });
  updateGraph();
  applyYearForces(graph, nodes);
});

function updateGraph() {
  const slider = document.getElementById('dataRange');
  const samplePercent = Number(slider.value);
  ({ nodes, links } = filterNodesAndLinks(fullGraph, samplePercent, folderLinksActive));
  updateGraphData(graph, nodes, links);
  // Reposition camera to frame all nodes: compute bounding box and set camera further back
  try {
    if (nodes && nodes.length) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      nodes.forEach(n => {
        const x = Number(n.x || 0), y = Number(n.y || 0), z = Number(n.z || 0);
        if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
      });
      const dx = maxX - minX || 1;
      const dy = maxY - minY || 1;
      const dz = maxZ - minZ || 1;
      const maxDim = Math.max(dx, dy, dz);
      const distance = Math.max(4000, maxDim * 6);
      // place camera centered on X/Z, slightly above Y
      graph.cameraPosition({ x: 0, y: Math.max(100, dy * 0.5), z: distance }, { x: 0, y: 0, z: 0 }, 800);
      // Increase FOV for wider view
      try {
        const camera = graph.camera && graph.camera();
        if (camera) {
          camera.fov = 75;
          camera.updateProjectionMatrix();
        }
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore camera adjust errors */ }
}