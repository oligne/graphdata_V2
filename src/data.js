export async function loadData(url) {
  const res = await fetch(url);
  return res.json();
}

export function filterNodesAndLinks(fullGraph, samplePercent = 100, folderLinks = true) {
  if (!fullGraph) return { nodes: [], links: [] };

  const excludedWords = ["fluid", "config", "cache", "twitter", "venv"];
  const sampleSize = samplePercent / 100;

  const filteredNodes = fullGraph.nodes
    .filter(node => node.type && node.type.toLowerCase() === "fichier")
    .sort(() => 0.01 - Math.random())
    .slice(0, Math.ceil(fullGraph.nodes.length * sampleSize))
    .filter(node => !excludedWords.some(word => node.id.toLowerCase().includes(word)));


  filteredNodes.forEach(node => {
    const dateStr = node.attributes?.["Date de Creation"];
    node.group = dateStr ? dateStr.slice(0, 4) : "inconnue";
  });
  

  let nodes = [...filteredNodes];
  let links = [];
  const folderNodes = {};

  if (folderLinks) {
    // MODE ARBO : TA LOGIQUE ACTUELLE (NE PAS TOUCHER)
    const folderToFiles = {};
    filteredNodes.forEach(node => {
      let chemin = node.attributes?.Chemin_x || '';
      let parts = chemin.split('/');
      let dossierCommun = '';
      for (let depth = parts.length - 2; depth >= 0; depth--) {
        let dossierComplet = parts.slice(0, depth + 1).join('/');
        if (!folderToFiles[dossierComplet]) folderToFiles[dossierComplet] = [];
        folderToFiles[dossierComplet].push(node.id);
        if (folderToFiles[dossierComplet].length > 1 && folderToFiles[dossierComplet].length <= 30 && !dossierCommun) {
          dossierCommun = dossierComplet;
        }
        if (folderToFiles[dossierComplet].length > 30) break;
      }
      node.dossierCommun = dossierCommun;
    });

    Object.entries(folderToFiles).forEach(([dossier, fileList]) => {
      if (fileList.length > 1 && fileList.length <= 10) {
        for (let i = 0; i < fileList.length; i++) {
          for (let j = i + 1; j < fileList.length; j++) {
            links.push({ source: fileList[i], target: fileList[j] });
          }
        }
      }
      if (fileList.length > 10) {
        if (!folderNodes[dossier]) {
          folderNodes[dossier] = {
            id: `folder_${dossier}`,
            label: dossier.split('/').pop(),
            type: 'folder',
            size: Math.min(10 + fileList.length / 5, 100)
          };
          nodes.push(folderNodes[dossier]);
        }
        fileList.forEach(fileId => {
          links.push({ source: fileId, target: folderNodes[dossier].id });
        });
      }
    });

  } else {
    // MODE LIENS DOSSIERS : chaque fichier relié à SON DOSSIER PARENT IMMÉDIAT (juste des étoiles)
    const folderToFiles = {};
    const folderNodes2 = {};
    nodes = []; // Réinitialise complètement les nœuds
    links = []; // Réinitialise complètement les liens

    // Crée une correspondance fichier → dossier parent immédiat
    filteredNodes.forEach(node => {
      let chemin = node.attributes?.Chemin_x || '';
      let parts = chemin.split('/');
      let dossier = parts.slice(0, -1).join('/'); // parent immédiat UNIQUEMENT
      if (!folderToFiles[dossier]) folderToFiles[dossier] = [];
      folderToFiles[dossier].push(node.id);
    });

    // Crée les nœuds dossier et les liens fichier → dossier
    Object.entries(folderToFiles).forEach(([dossier, fileList]) => {
      if (!folderNodes2[dossier]) {
        folderNodes2[dossier] = {
          id: `folder_${dossier}`,
          label: dossier.split('/').pop(),
          type: 'folder',
          size: Math.min(10 + fileList.length / 5, 100)
        };
        nodes.push(folderNodes2[dossier]);
      }
      // UNIQUEMENT liens fichier → dossier (PAS de liens entre fichiers)
      fileList.forEach(fileId => {
        links.push({ source: fileId, target: folderNodes2[dossier].id });
      });
    });

    // Ajoute les fichiers comme nœuds
    nodes = nodes.concat(filteredNodes);
  }

  return { nodes, links };
}


