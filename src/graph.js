// import * as THREE from 'three';
import * as THREE from 'three';
import { forceX, forceY, forceZ, forceManyBody, forceCollide } from 'd3-force-3d';
import { filterNodesAndLinks } from './data.js';

const extensionColors = {
  'pdf':   '#ff4d4d',
  'jpg':   '#ff6666',
  'jpeg':  '#ff8080',
  'png':   '#ff9999',
  'docx':  '#ff3333',
  'txt':   '#ff1a1a',
  'csv':   '#ff7373',
  'zip':   '#ffb3b3',
  'pptx':  '#ff6666',
  'xlsx':  '#ff9999',
  'js':    '#ffcccc',
  'py':    '#ff7f7f',
  'html':  '#ff5252',
  'css':   '#ff8585',
  // Ajoute d'autres extensions si besoin
  'default': '#fff'
};


export function createGraph(container) {
    const graph = window.ForceGraph3D()(container)
    .backgroundColor('#1c1919')
    //.nodeColor('Extension')
    .nodeColor(node => {
  const ext = node.attributes?.Extension?.toLowerCase();
  return extensionColors[ext] || extensionColors['default'];
})
    .d3VelocityDecay(0.4)
    .linkWidth(0.3)
    .linkOpacity(1)
    // Force fully opaque nodes with MeshBasicMaterial (no lighting/shadows)
    .nodeOpacity(1)
    .nodeRelSize(50)
    .nodeThreeObject(node => {
      const ext = node.attributes?.Extension?.toLowerCase();
      const color = extensionColors[ext] || extensionColors['default'];
      const geom = new THREE.SphereGeometry(2, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: false, opacity: 1 });
      const mesh = new THREE.Mesh(geom, mat);
      return mesh;
    })
    .nodeThreeObjectExtend(false);
 
 
   return graph;

    // Disable renderer shadows (if any)
    setTimeout(() => {
      try {
        const renderer = graph.renderer && graph.renderer();
        if (renderer) {
          renderer.shadowMap.enabled = false;
        }
      } catch (e) { /* ignore */ }
    }, 0);

     // .onNodeClick(node => {
    //       // Aim at node from outside it
    //       const distance = 40;
    //       const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    //       const newPos = node.x || node.y || node.z
    //         ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
    //         : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    //       graph.cameraPosition(
    //         newPos, // new position
    //         node, // lookAt ({ x, y, z })
    //         3000  // ms transition duration
    //       );
    //     });

    
}

export function updateGraphData(graph, nodes, links) {
  graph.graphData({ nodes, links })
  
}

export function getNodeAndFolderCounts(graph) {
  const nodes = graph?.graphData()?.nodes || [];
  let files = 0, folders = 0;
  for (const n of nodes) {
    const t = (n.type || '').toString().toLowerCase();
    if (t === 'fichier' || t === 'file') files++;
    else if (t === 'folder' || t === 'dossier') folders++;
    else if (String(n.id || '').startsWith('folder_')) folders++;
  }
  return { files, folders, total: nodes.length };
}

// Forces par mode (différence visuelle entre Arbo et Temporalité)
export function applyLayoutForces(graph, mode = 'arbo') {
  const gd = graph.graphData();
  const nodes = gd?.nodes || [];

  // Charge/collision communes
  graph.d3Force('charge', forceManyBody().strength(-40));
  graph.d3Force('collision', forceCollide(d => (d.size ? d.size * 0.6 : 6)).iterations(2));

  // Distances/strength des liens
  const link = graph.d3Force('link');
  if (link && typeof link.distance === 'function') {
    link
      .distance(l => {
        const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
        const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
        const isFolderLink = (s?.type === 'folder' || t?.type === 'folder');
        return isFolderLink ? 70 : 28;
      })
      .strength(l => {
        const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
        const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
        const isFolderLink = (s?.type === 'folder' || t?.type === 'folder');
        return isFolderLink ? 0.6 : 0.3;
      });
  }

  // Reset / set axes
  graph.d3Force('x', null);
  graph.d3Force('y', null);
  graph.d3Force('z', null);

  if (mode === 'year') {
    // Etalement horizontal (X) par année extraite de node.group
    const files = nodes.filter(n => (n.type || '').toLowerCase() !== 'folder');
    const years = Array.from(new Set(files.map(n => {
      const y = Number(String(n.group || '').slice(0, 4));
      return Number.isFinite(y) ? y : null;
    }).filter(v => v != null))).sort((a, b) => a - b);

    const min = years[0] ?? 2000;
    const max = years[years.length - 1] ?? (min + 1);
    const span = Math.max(1, max - min);
    const width = Math.max(800, years.length * 220);
    const startX = -width / 2;
    const yearToX = y => {
      const ny = Number(String(y).slice(0, 4));
      if (!Number.isFinite(ny)) return 0;
      return startX + ((ny - min) / span) * width;
    };

    graph.d3Force('x', forceX(d => {
       // Fichiers: tirés vers leur colonne (année). Dossiers: suivront par liens.
       if ((d.type || '').toLowerCase() === 'folder') return 0;
       return yearToX(d.group);
     }).strength(d => ((d.type || '').toLowerCase() === 'folder' ? 0.015 : 0.08)));

    graph.d3Force('y', forceY(0).strength(0.08)); // aligne sur une ligne horizontale
    graph.d3Force('z', forceZ(0).strength(0.25)); // applatissement plus fort pour garder tout sur un plan
   } else {
     // Arbo / Dossiers: centrage doux
    graph.d3Force('x', forceX(0).strength(0.05));
    graph.d3Force('y', forceY(0).strength(0.06));
    graph.d3Force('z', forceZ(0).strength(0.6)); // strongly flatten z to zero
   }

   graph.resetCountdown(); // relance la simu
 }

 // Assure l’appel dans ton updateGraph existant
 export function updateGraphFactory(graph, fullGraph) {
  return function updateGraph(samplePercent = 100, mode = 'arbo') {
    const data = filterNodesAndLinks(fullGraph, samplePercent, mode);
    graph.graphData(data);
    applyLayoutForces(graph, mode);
  };
}
