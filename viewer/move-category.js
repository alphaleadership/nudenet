const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function moveCategory(categoryName) {
    try {
        // Vérifier si le dossier existe dans ./good
        const sourcePath = path.join(__dirname, 'good', categoryName);
        const targetPath = path.join(__dirname, 'media');
        const downloadsPath = path.join(__dirname, 'downloads.json');

        // Vérifier si le dossier source existe
        const sourceExists = await fs.access(sourcePath).then(() => true).catch(() => false);
        if (!sourceExists) {
            console.error(`Le dossier ${categoryName} n'existe pas dans ./good`);
            return;
        }

        // Vérifier si le dossier cible existe déjà
        const targetExists = await fs.access(targetPath).then(() => true).catch(() => false);
      

        // Déplacer le contenu du dossier
        const files = await fs.readdir(sourcePath);
        for (const file of files) {
            const sourceFile = path.join(sourcePath, file);

            const targetFile = path.join(__dirname, 'media', file.split('.')[0].split('-')[0]+"-"+fs.readdir(sourcePath).length+path.extname(file));
            console.log( fsSync.readdirSync(targetPath).length);
            // Vérifier si le fichier cible existe déjà
            const targetExists = await fs.access(targetFile).then(() => true).catch(() => false);
            if (targetExists) {
                console.log(`Le fichier ${file} existe déjà dans ./media, il sera remplacé`);
            }
            const downloads = JSON.parse(await fs.readFile(downloadsPath, 'utf-8'));
            downloads.downloads.map(id => {
                if (id.localPath && id.localPath==sourcePath) {
                    const oldPath = id.localPath;
                    const newPath = targetFile;
                    id.localPath = newPath;
                    console.log(`Mise à jour du chemin pour ${id}: ${oldPath} -> ${newPath}`);
                }
                return id;
            });
            // Déplacer le fichier
            //await fs.rename(sourceFile, targetFile);  
            //await fs.writeFile(downloadsPath, JSON.stringify(downloads, null, 2));
            console.log('downloads.json mis à jour avec succès');
        }
        
        // Supprimer le dossier vide source
        //await fs.rmdir(sourcePath);
        console.log(`Contenu de ${categoryName} déplacé de ./good vers ./media`);

        // Lire et mettre à jour downloads.json
        
        
        // Mettre à jour les chemins pour cette catégorie
       

        // Sauvegarder les modifications
      

    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

// Vérifier les arguments
if (process.argv.length !== 3) {
    console.error('Usage: node move-category.js <nom_du_dossier>');
    process.exit(1);
}

const categoryName = process.argv[2];
moveCategory(categoryName).catch(console.error);
