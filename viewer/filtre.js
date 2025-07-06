const fs = require('fs');
const path = require('path');

function filterDownloads() {
    try {
        // Lire le fichier downloads.json
        const downloadsPath = path.join(__dirname, 'downloads.json');
        const downloadsData = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
        
        console.log(`Nombre total d'entrées: ${downloadsData.downloads.length}`);
        
        // Filtrer les entrées en vérifiant l'existence des fichiers et l'unicité des liens
        const seenLinks = new Set();
        const validDownloads = downloadsData.downloads.filter(download => {
            const filePath = download.localPath;
            const originalLink = download.originalLink;
            
            // Vérifier si le lien n'a pas déjà été vu
            if (seenLinks.has(originalLink)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Suppression du fichier du doublon: ${filePath}`);
                } catch (unlinkError) {
                    console.error(`Erreur lors de la suppression du fichier du doublon ${filePath}:`, unlinkError);
                }
                return false;
            }
            
            // Vérifier si le chemin existe
            const exists = fs.existsSync(filePath);
            
            if (exists) {
                if (filePath.includes(`good\\${require('./categories').getCategory(download.account)}\\`) || filePath.includes("media\\")) {
                    // Ajouter le lien au Set des liens vus
                    seenLinks.add(originalLink);
                    return true;
                } else {
                    try {
                        // Vérifier si le fichier est dans le dossier 'good'
                        if (filePath.includes('good\\')) {
                            // Extraire le nom du fichier
                            
                            // Déterminer la nouvelle catégorie
                            const newCategory = require('./categories').getCategory(download.account);
                            const fileName = path.basename(filePath).split('.')[0]+"-"+fs.readdirSync(path.join(__dirname, 'good', ""+newCategory+"").length+path.extname(filePath));
                            // Créer le nouveau chemin dans la bonne catégorie
                            const newFilePath = path.join(__dirname, 'good', ""+newCategory+"", fileName);
                            console.log(newFilePath)
                            // Créer le dossier de destination s'il n'existe pas
                            fs.mkdirSync(path.dirname(newFilePath), { recursive: true });
                            
                            // Déplacer le fichier
                            fs.renameSync(filePath, newFilePath);
                            console.log(`Fichier déplacé vers: ${newFilePath}`);
                        } else {
                            // Pour les autres cas, supprimer le fichier
                            fs.unlinkSync(filePath);
                            console.log(`Fichier supprimé: ${filePath}`);
                        }
                    } catch (unlinkError) {
                        console.error(`Erreur lors du déplacement/suppression de ${filePath}:`, unlinkError);
                    }
                    return false;
                }
            } else {
                return false;
            }
        });
        
        // Écrire le résultat dans le fichier
        const outputPath = path.join(__dirname, 'downloads.json');
        fs.writeFileSync(outputPath, JSON.stringify({downloads:validDownloads}, null, 2));
        
        console.log(`Filtrage terminé. ${(validDownloads.length/downloadsData.downloads.length*100).toFixed(2)} % entrées valides trouvées.`);
        console.log(`Nombre de fichiers supprimés: ${downloadsData.downloads.length - validDownloads.length}`);
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
    }
}

filterDownloads();