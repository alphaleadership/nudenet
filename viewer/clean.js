const fs = require("fs");
const path = require('path');

/**
 * Removes an entry from downloads.json when a file is deleted
 * @param {string} filePath - Path of the deleted file
 */
function removeDownloadEntry(filePath) {
  const downloadsFile = path.join(__dirname, 'downloads.json');
  try {
    if (fs.existsSync(downloadsFile)) {
      const data = fs.readFileSync(downloadsFile, 'utf8');
      const downloads = JSON.parse(data).downloads;
      
      // Filter out the deleted file's entry
      const updatedDownloads = downloads.filter(download => download.localPath !== filePath);
      
      // Save the updated downloads
      fs.writeFileSync(downloadsFile, JSON.stringify({ downloads: updatedDownloads }, null, 2));
      console.log(`Removed download entry for: ${filePath}`);
    }
  } catch (err) {
    console.error('Error removing download entry:', err);
  }
}

// Définir le chemin prioritaire
const PRIORITY_PATH = path.resolve("C:\\Users\\alpha\\ia\\viewer\\good");

const dedup = (...paths) => {
  const allPaths = [];
  
  // Fonction récursive pour explorer les sous-dossiers
  const exploreSubdirectories = (dirPath) => {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        try {
          if (fs.statSync(fullPath).isDirectory()) {
            allPaths.push(fullPath);
            exploreSubdirectories(fullPath);
          }
        } catch (error) {
          console.log(`Erreur lors de l'accès à ${fullPath}: ${error.message}`);
        }
      });
    } catch (error) {
      console.log(`Erreur lors de la lecture du dossier ${dirPath}: ${error.message}`);
    }
  };

  // Explorer les sous-dossiers pour chaque chemin fourni
  paths.forEach(dirPath => {
    try {
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        allPaths.push(dirPath);
        exploreSubdirectories(dirPath);
      }
    } catch (error) {
      console.log(`Erreur lors de l'accès à ${dirPath}: ${error.message}`);
    }
  });

  return parsePaths(...allPaths);
  }
  parsePaths=(...paths)=>{
    // Filter out duplicates and non-existent directories
    const uniquePaths = [...new Set(paths)].filter(pat => {
        try {
            return fs.existsSync(path.resolve(pat)) &&
                fs.statSync(path.resolve(pat)).isDirectory();
        } catch (error) {
            console.log(`Directory does not exist or is not accessible: ${pat}`);
            return false;
        }
    });
    var allFiles = uniquePaths.map(pat => {
        // Résoudre le chemin absolu du dossier
        const resolvedPath = path.resolve(pat);
       // console.log(path.dirname(resolvedPath))
        const isPriority = resolvedPath.includes(PRIORITY_PATH);
        
        try {
        return fs.readdirSync(resolvedPath, "utf8")
            .filter(fi => !fs.statSync(path.join(resolvedPath, fi)).isDirectory())
            .map((fi) => {
            // Résoudre le chemin absolu pour chaque fichier
            const filePath = path.resolve(path.join(resolvedPath, fi));
          //  console.log(path.dirname(filePath))
            return {
                path: filePath,
                isPriority: isPriority
            };
        });
        } catch (error) {
            console.log(`Error reading directory ${resolvedPath}: ${error.message}`);
            return [];
        }
    }).flat();

    if (allFiles.length) {
        // Trier les fichiers par taille
        allFiles = allFiles.filter(file => fs.statSync(file.path).isFile());
        console.log(allFiles.length)
        allFiles.sort((a, b) => {
            try {
            var statA = fs.statSync(a.path);
            var statB = fs.statSync(b.path);
            return statA.size - statB.size;
            } catch (error) {
                console.log(`Error comparing file sizes: ${error.message}`);
                return 0;
            }
        });

        var sizes = {};
        for (let i = 0; i < allFiles.length; i++) {
            var fileObj = allFiles[i];
            var chem = fileObj.path;

            try {
            var stat = fs.statSync(chem);
            var size = stat.size;
            if (!sizes[size]) {
                sizes[size] = [fileObj];
            } else {
                sizes[size].push(fileObj);
            }
            } catch (error) {
                console.log(`Error accessing file ${chem}: ${error.message}`);
        }
        }

        // Comparer les fichiers de même taille entre eux, y compris entre les différents dossiers
        for (var size in sizes) {
            if (sizes[size].length > 1) {
                for (let i = 0; i < sizes[size].length; i++) {
                    var fileObj1 = sizes[size][i];
                    if (!fileObj1) continue; // Ignorer les entrées nulles
                    
                    try {
                    var temp = fs.readFileSync(fileObj1.path).toString();
                    for (let e = i + 1; e < sizes[size].length; e++) {
                        var fileObj2 = sizes[size][e];
                        if (!fileObj2) continue; // Ignorer les entrées nulles
                        
                            try {
                                var temp2 = fs.readFileSync(fileObj2.path).toString();
                                if (temp === temp2) {
                            // Déterminer quel fichier supprimer en fonction de la priorité
                            let fileToDelete, fileToKeep;
                            
                            if (fileObj1.isPriority && !fileObj2.isPriority) {
                                // Le premier fichier est prioritaire, on supprime le second
                                fileToDelete = fileObj2.path;
                                fileToKeep = fileObj1.path;
                                sizes[size][e] = null; // Marquer comme supprimé
                            } else if (!fileObj1.isPriority && fileObj2.isPriority) {
                                // Le second fichier est prioritaire, on supprime le premier
                                fileToDelete = fileObj1.path;
                                fileToKeep = fileObj2.path;
                                sizes[size][i] = null; // Marquer comme supprimé
                                break; // Sortir de la boucle interne car fileObj1 est supprimé
                            } else {
                                // Aucun n'est prioritaire ou les deux le sont, comportement par défaut
                                fileToDelete = fileObj2.path;
                                fileToKeep = fileObj1.path;
                                sizes[size][e] = null; // Marquer comme supprimé
                            }
                            
                                    try {
                            // Remove entry from downloads.json before deleting the file
                            removeDownloadEntry(fileToDelete);
                            fs.unlinkSync(fileToDelete);
                            console.log(`${fileToDelete} est dupliquée de ${fileToKeep}`);
                                    } catch (error) {
                                        console.log(`Error deleting file ${fileToDelete}: ${error.message}`);
                        }
                    }
                            } catch (error) {
                                console.log(`Error reading file ${fileObj2.path}: ${error.message}`);
                }
            }
                    } catch (error) {
                        console.log(`Error reading file ${fileObj1.path}: ${error.message}`);
        }
    }
                // Nettoyer les entrées nulles
                sizes[size] = sizes[size].filter(item => item !== null);
}
        }
    }

    // Retourner uniquement les chemins de fichiers (sans les métadonnées)
    return allFiles.filter(item => item !== null).map(item => item.path);
}
dedup('C:\\Users\\alpha\\cache\\cache_files\\pbs.twimg.com',"C:\\Mes Sites Web\\cache\\pbs.twimg.com\\media","C:\\Users\\alpha\\ia\\viewer\\media","C:\\Users\\alpha\\ia\\viewer\\good","C:\\Users\\alpha\\twitter\\video")
module.exports = { dedup: (paths) => dedup('C:\\Users\\alpha\\cache\\cache_files\\pbs.twimg.com',"C:\\Mes Sites Web\\cache\\pbs.twimg.com\\media", ...paths) };
function transferImages(srcDir, destDir) {
    const fs = require('fs');
    const path = require('path');

    fs.readdirSync(srcDir, "utf8").forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.renameSync(srcPath, destPath);
        console.log(`Image ${file} transférée de ${srcDir} à ${destDir}`);
    });
}

// Exemple d'utilisation
//transferImages('C:\\Users\\alpha\\cache\\cache_files\\pbs.twimg.com', "C:\\Mes Sites Web\\cache\\pbs.twimg.com\\media");
//transferImages("C:\\Mes Sites Web\\cache\\pbs.twimg.com\\media","./media")
//transferImages("./routes/good","./media")

