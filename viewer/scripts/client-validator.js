const http = require('http');
const fs = require('fs');

// Configuration du client
const baseUrl = 'http://localhost'; // URL du serveur Express
const delayBetweenImages = 1000; // Délai en millisecondes entre chaque image
const urlFilePath = 'C:\\Users\\alpha\\twitter\\urls.txt'; // Chemin du fichier à modifier

// Fonction pour obtenir les données de l'image
function getImageData(position) {
    try {
        const options = {
            hostname: 'localhost',
            port: 80,
            path: `/imagedata/${position}`,
            method: 'GET'
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', (error) => {
                console.error('Erreur lors de la récupération des données de l\'image:', error);
                removeFirstLine();
                reject(error);
            });

            req.end();
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données de l\'image:', error);
        removeFirstLine();
        throw error;
    }
}

// Fonction pour déterminer la catégorie basée sur les données de l'image
function getCategory(account) {
    try {
        const options = {
            hostname: 'localhost',
            port: 80,
            path: `/categorie/${account}`,
            method: 'GET'
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data).category);
                });
            });

            req.on('error', (error) => {
                console.error('Erreur lors de la récupération de la catégorie:', error);
                reject(error);
            });

            req.end();
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error);
        throw error;
    }
}

// Fonction pour supprimer la première ligne
function removeFirstLine() {
    try {
        const data = fs.readFileSync(urlFilePath, 'utf8');
        const lines = data.split('\n');
        
        if (lines.length > 0) {
            lines.shift();
            fs.writeFileSync(urlFilePath, lines.join('\n'));
            console.log('Première ligne supprimée avec succès');
        } else {
            console.log('Aucune ligne à supprimer');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la ligne:', error);
    }
}

// Fonction pour valider une image
async function validateImage(position) {
    try {
        console.log(`\nTraitement de l'image ${position}`);
        const imageData = await getImageData(position);
        
        if (!imageData) {
            console.log('Image non trouvée');
            return false;
        }

        // Obtenir la catégorie depuis le serveur
        const category = await getCategory(imageData.account);
        console.log(`Catégorie obtenue: ${category}`);
        
        // Vérifier que la catégorie est un nombre
        if (typeof category !== 'number' || isNaN(category)) {
            console.error('Erreur: La catégorie doit être un nombre');
            return false;
        }
        
        // Déplacer l'image selon sa catégorie
        const groupe = category.toString();
        
        // Effectuer la requête pour déplacer l'image
        const moveOptions = {
            hostname: 'localhost',
            port: 80,
            path: `/move/${position}/${groupe}`,
            method: 'GET'
        };

        const moveReq = http.request(moveOptions, (res) => {
            res.on('end', () => {
                console.log(`Image déplacée vers ${groupe}`);
            });
        });

        moveReq.on('error', (error) => {
            console.error('Erreur lors du déplacement de l\'image:', error);
            throw error;
        });

        moveReq.end();
        return true;
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
        return false;
    }
}

// Fonction principale
async function main() {
    console.log('Début de la validation des images...');
    
    // Commencer avec la première image
    let position = 0;
    let valid = await validateImage(position);
    // Boucle infinie pour traiter les images
    while (valid) {
        position++;
        
        // Délai avant de traiter la prochaine image
        //await new Promise(resolve => setTimeout(resolve, delayBetweenImages));
        
        valid = await validateImage(position);
    }
}

// Exécuter le script
main();
