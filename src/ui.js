import { typeWriter, simplifyPath } from './utils.js';
import { getNodeAndFolderCounts } from './graph.js';

export function setupUI({ graph, fullGraph, updateGraph, setFolderLinksActive, getFolderLinksActive }) {
// const tooltip = document.getElementById('node-tooltip');
// tooltip.style.display = 'block';
// tooltip.style.left = '200px';
// tooltip.style.top = '200px';
// tooltip.innerHTML = 'VISIBLE ?';


const tooltip = document.getElementById('node-tooltip');
 console.log('tooltip:', tooltip);

 let typeWriterTimeout = null;

  graph.onNodeHover(node => {
    if (node) {
       console.log('SURVOL NODE', node.id, tooltip.innerHTML);

        if (typeWriterTimeout) clearTimeout(typeWriterTimeout);
      tooltip.style.display = 'block';
      const rawPath = node.attributes?.Chemin_x || '';
      const simplePath = simplifyPath(rawPath);
      const dossier = node.attributes?.Dossier || '';
      const date = node.attributes?.["Date de Creation"] || '';
      const info =
        `${node.id}\nType: ${node.type || ''}\nChemin: ${simplePath}\nDossier: ${dossier}\nDate: ${date}`;


      // Typewriter modifié pour garder la main sur le timeout
    let i = 0;
    function write() {
      tooltip.innerHTML = info.slice(0, i);
      if (i < info.length) {
        i++;
        typeWriterTimeout = setTimeout(write, 12);
      }
    }
    write();

    } else {
      if (typeWriterTimeout) clearTimeout(typeWriterTimeout);
      tooltip.style.display = 'none';
      tooltip.textContent = '';
    }
  });

  document.getElementById('3d-graph').addEventListener('mousemove', e => {
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
  });

  document.getElementById('3d-graph').addEventListener('mousemove', e => {
  // Position par défaut
  let left = e.clientX + 15;
  let top = e.clientY + 15;

  // Largeur/hauteur du tooltip (après mise à jour du contenu)
  const tooltipRect = tooltip.getBoundingClientRect();
  const padding = 10;

  // Limite à droite
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  // Limite en bas
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding;
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
});

  // Slider
  const slider = document.getElementById('dataRange');
  const sliderValue = document.getElementById('sliderValue');
  const sliderInfo = document.getElementById('sliderInfo');
  const toggleFolderLinks = document.getElementById('toggleFolderLinks');

  // Default: 100% dataset on load
  if (slider) {
    slider.value = '100';
  }

  function updateAll() {
    const min = Number(slider.min);
    const max = Number(slider.max);
    const val = Number(slider.value);
    const sliderWidth = slider.offsetWidth;
    const knobWidth = 20;
    const percent = (val - min) / (max - min);
    const left = percent * (sliderWidth - knobWidth) + knobWidth / 2 - sliderValue.offsetWidth / 2;
    sliderValue.style.left = `${left}px`;
    sliderValue.textContent = `${val}%`;

    // Laisse le graph appliquer ses données, puis compte sur le frame suivant
    requestAnimationFrame(() => {
      const { files, folders, total } = getNodeAndFolderCounts(graph);
      sliderInfo.textContent = `Soit ${files} Fichiers et ${folders} Dossiers (Total: ${total})`;
    });

    const folderLinksActive = toggleFolderLinks.classList.contains('active');
    if (typeof setFolderLinksActive === 'function') setFolderLinksActive(folderLinksActive);
    // Also request a graph update when UI changes (slider/toggle)
    if (typeof updateGraph === 'function') updateGraph();
  }

  slider.addEventListener('input', updateAll);
  window.addEventListener('DOMContentLoaded', updateAll);

  // Toggle "LIENS DOSSIERS"
  if (toggleFolderLinks && setFolderLinksActive && getFolderLinksActive) {
    toggleFolderLinks.addEventListener('click', () => {
      toggleFolderLinks.classList.toggle('active');
      updateAll();
    });
    // Initialisation visuelle du toggle selon l'état
    if (getFolderLinksActive()) {
      toggleFolderLinks.classList.add('active');
    } else {
      toggleFolderLinks.classList.remove('active');
    }
  }

  // Initialisation
  sliderValue.textContent = `${slider.value}%`;
updateAll();


    
  /// Slider, toggle, tooltip, etc.
  // Ajoute les event listeners ici
  // Ex: slider.addEventListener('input', ...)
 
  let autoOrbit = true;
  let angle = 0;
  let orbitAnimId = null;

  function startOrbit() {
    autoOrbit = true;
    const camPos = graph.cameraPosition();
    angle = Math.atan2(camPos.x, camPos.z);
    let currentRadius = Math.sqrt(camPos.x * camPos.x + camPos.z * camPos.z);

    function animateOrbit() {
      angle += 0.002;
      const x = currentRadius * Math.sin(angle);
      const z = currentRadius * Math.cos(angle);
      graph.cameraPosition({ x, y: camPos.y, z }, { x: 0, y: 0, z: 0 });
      orbitAnimId = requestAnimationFrame(animateOrbit);
    }
    animateOrbit();
    graph.controls().enabled = false;
  }

  function stopOrbit() {
    autoOrbit = false;
    if (orbitAnimId) cancelAnimationFrame(orbitAnimId);
  graph.controls().enabled = true;         // réactive tous les contrôles
  graph.controls().enablePan = false;      // désactive le déplacement (pan)
  graph.controls().enableZoom = true;      // garde le zoom
  graph.controls().enableRotate = true;    // garde la rotation
// Bloque le pan (déplacement X/Y)
  const controls = graph.controls();
  controls.addEventListener('change', () => {
    controls.target.set(0, controls.target.y, 0);
    controls.target.set(0, controls.target.x, 0);
    controls.target.set(0, controls.target.z, 0);
  });
  }

  // Toggle switch
  const toggleSwitch = document.getElementById('toggleSwitch');
  toggleSwitch.addEventListener('click', () => {
    const isActive = toggleSwitch.classList.toggle('active');
    if (isActive) {
      startOrbit();   // rotation auto
    } else {
      stopOrbit();    // souris
    }
  });

  // Arrêt de l'auto-orbit si interaction souris/touch
  const elem = document.getElementById('3d-graph');
  elem.addEventListener('mousedown', () => {
    if (autoOrbit) {
      stopOrbit();
      toggleSwitch.classList.remove('active');
      
    }
  });
  elem.addEventListener('wheel', () => {
    if (autoOrbit) {
      stopOrbit();
      toggleSwitch.classList.remove('active');
      
    }
  });
  elem.addEventListener('touchstart', () => {
    if (autoOrbit) {
      stopOrbit();
      toggleSwitch.classList.remove('active');
    }
  });

  // Démarre en mode rotation auto par défaut
  toggleSwitch.classList.add('active');
  startOrbit();
  


  // --- Export PNG HD ---
  function downloadDataUrl(dataUrl, name = 'graph-export.png') {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function exportGraphImage(scale = 4) {
    const container = document.getElementById('3d-graph');
    const canvas = container?.querySelector('canvas');

    const renderer = graph.renderer ? graph.renderer() : null;
    const scene = graph.scene ? graph.scene() : null;
    const camera = graph.camera ? graph.camera() : null;

    try {
      if (renderer && scene && camera) {
        const origPR = renderer.getPixelRatio ? renderer.getPixelRatio() : (window.devicePixelRatio || 1);
        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer.setPixelRatio(scale);
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);

        const dataUrl = renderer.domElement.toDataURL('image/png');

        // Restore
        renderer.setPixelRatio(origPR);
        renderer.setSize(width, height, false);

        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadDataUrl(dataUrl, `graph-${ts}.png`);
      } else if (canvas) {
        // Fallback: upscale via canvas temporaire
        const tmp = document.createElement('canvas');
        const up = 2;
        tmp.width = canvas.width * up;
        tmp.height = canvas.height * up;
        const ctx = tmp.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fond (optionnel)
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#1c1919';
        ctx.fillRect(0, 0, tmp.width, tmp.height);

        ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        const dataUrl = tmp.toDataURL('image/png');

        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadDataUrl(dataUrl, `graph-${ts}.png`);
      }
    } catch (e) {
      console.error('Export graph failed:', e);
      if (canvas) downloadDataUrl(canvas.toDataURL('image/png'));
    }
  }

  // Create export menu with quality options
  function createExportMenu() {
    const menu = document.createElement('div');
    menu.id = 'exportMenu';
    menu.style.cssText = `
      position: fixed;
      right: 80px;
      bottom: 20px;
      background: #2b2b2bcc;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 12px;
      z-index: 9999;
      backdrop-filter: blur(6px);
      display: none;
      flex-direction: column;
      gap: 8px;
      min-width: 160px;
    `;

    const qualityLevels = [
      { name: 'PNG HD (2x)', scale: 2, fn: () => exportGraphImage(2) },
      { name: 'PNG Ultra (4x)', scale: 4, fn: () => exportGraphImage(4) },
      { name: 'PNG Max (8x)', scale: 8, fn: () => exportGraphImage(8) },
      { name: 'GIF 30s', fn: () => recordGif(30) },
      { name: 'WebM 60s', fn: () => recordWebM(60) },
    ];

    qualityLevels.forEach(level => {
      const btn = document.createElement('button');
      btn.textContent = level.name;
      btn.style.cssText = `
        background: #333;
        color: #fff;
        border: 1px solid #555;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      `;
      btn.onmouseover = () => btn.style.background = '#444';
      btn.onmouseout = () => btn.style.background = '#333';
      btn.onclick = () => {
        level.fn();
        menu.style.display = 'none';
      };
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    return menu;
  }

  function recordGif(duration = 30) {
    console.log('GIF recording for', duration, 'seconds');
    alert('GIF recording — cette fonctionnalité nécessite gif.js library. À implémenter selon tes besoins.');
  }

  function recordWebM(duration = 60) {
    console.log('WebM recording for', duration, 'seconds');
    alert('WebM recording — à implémenter avec MediaRecorder API');
  }

  // FAB export (créé dynamiquement, pas besoin de HTML)
  const exportMenu = createExportMenu();
  if (!document.getElementById('exportFab')) {
    const btn = document.createElement('button');
    btn.id = 'exportFab';
    btn.className = 'export-fab';
    btn.title = 'Exporter (clic = menu)';
    btn.setAttribute('aria-label', 'Exporter en PNG');
    // Icône download (SVG)
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M5 20h14a1 1 0 0 0 1-1v-3h-2v2H6v-2H4v3a1 1 0 0 0 1 1zm7-3 5-5h-3V4h-4v8H7l5 5z"/>
      </svg>
    `;
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      exportMenu.style.display = exportMenu.style.display === 'none' ? 'flex' : 'none';
    });
  }

  // Raccourci clavier (E) pour exporter rapidement
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey) {
      exportGraphImage(3);
    }
  });

}

