const fs = require('fs');
const path = require('path');

/**
 * Updates the downloads.json file when an image is renamed
 * @param {string} oldPath - Original file path
 * @param {string} newPath - New file path
 */
function updateDownloadInfo(oldPath, newPath) {
  const downloadsFile = path.join(__dirname, 'downloads.json');
  try {
    if (fs.existsSync(downloadsFile)) {
      const data = fs.readFileSync(downloadsFile, 'utf8');
      const downloads = JSON.parse(data).downloads;
      
      // Find and update the record with the old path
      const updatedDownloads = downloads.map(download => {
        if (download.localPath === oldPath) {
          return { ...download, localPath: newPath };
        }
        return download;
      });
      
      // Save the updated downloads
      fs.writeFileSync(downloadsFile, JSON.stringify({ downloads: updatedDownloads }, null, 2));
      console.log(`Updated downloads.json for: ${oldPath} -> ${newPath}`);
    }
  } catch (error) {
    console.error('Error updating downloads.json:', error.message);
  }
}

/**
 * Updates downloads.json when renaming files in a directory
 * @param {string} directoryPath - Path to the directory being renamed
 * @param {string} oldName - Original file name
 * @param {string} newName - New file name
 */
function updateDownloadsForRename(directoryPath, oldName, newName) {
  const oldPath = path.join(directoryPath, oldName);
  const newPath = path.join(directoryPath, newName);
  updateDownloadInfo(oldPath, newPath);
}

function renameFiles(directoryPath) {
  try {
    // Créer un dossier temporaire
    const tempDir = path.join(directoryPath, 'temp_rename');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Lire le contenu du dossier
    const files = fs.readdirSync(directoryPath);
    
    // Trier les fichiers pour maintenir l'ordre
    files.sort();
    let bfile=[]
    // Parcourir chaque fichier
    files.forEach((file, index) => {
      bfile.push(file)
      const oldPath = path.join(directoryPath, file);
      
      // Ignorer le dossier temporaire
      if (file === 'temp_rename') return;
      
      // Vérifier si c'est un fichier
      if (fs.statSync(oldPath).isFile()) {
        // Extraire l'extension
        const ext = path.extname(file);
        
        // Extraire la catégorie (tout ce qui est avant le premier underscore)
        const category = file.split('-')[0];
        
        // Créer le nouveau nom de fichier
        const newName = `${category}-${index + 1}${ext}`;
        const tempPath = path.join(tempDir, newName);
        
        // Copier le fichier vers le dossier temporaire avec le nouveau nom
        fs.copyFileSync(oldPath, tempPath);
        console.log(`Copié vers temp: ${file} -> ${newName}`);
      }
    });

    // Supprimer les fichiers originaux
    files.forEach(file => {
      if (file !== 'temp_rename') {
        const oldPath = path.join(directoryPath, file);
        if (fs.statSync(oldPath).isFile()) {
          fs.unlinkSync(oldPath);
        }
      }
    });

    // Déplacer les fichiers du dossier temporaire vers le dossier principal
    const tempFiles = fs.readdirSync(tempDir);
    tempFiles.forEach((file,index) => {
      const tempPath = path.join(tempDir, file);
      const newPath = path.join(directoryPath, file);
      
      // Find the original file name
      const originalFile = files.find(f => 
        f !== 'temp_rename' && 
        f !== file && 
        path.extname(f) === path.extname(file) && 
        f.startsWith(file.split('-')[0])
      );
      console.log(originalFile)
      if (originalFile) {
        // Update downloads.json with the new path
        updateDownloadsForRename(directoryPath, bfile[index], file);
      }
      
      fs.renameSync(tempPath, newPath);
    });

    // Supprimer le dossier temporaire
    fs.rmdirSync(tempDir);
    
    console.log('Renommage terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors du renommage:', error.message);
  }
}

// Exemple d'utilisation
// renameFiles('./mon_dossier');
fs.readdirSync("./good").map((folder)=>{
    renameFiles(path.join("./good",folder))
})
renameFiles("./media")

