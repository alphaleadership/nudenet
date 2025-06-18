const fs = require('fs');
const path = require('path');

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
    
    // Parcourir chaque fichier
    files.forEach((file, index) => {
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
    tempFiles.forEach(file => {
      const tempPath = path.join(tempDir, file);
      const newPath = path.join(directoryPath, file);
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

