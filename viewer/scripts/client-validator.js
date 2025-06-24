const axios = require('axios');
const fs = require('fs');

// Configuration du client
const baseUrl = 'http://localhost'; // URL du serveur Express
const delayBetweenImages = 500; // Délai en millisecondes entre chaque image
const urlFilePath = 'C:\\Users\\alpha\\twitter\\urls.txt'; // Chemin du fichier à modifier

// Fonction pour obtenir les données de l'image
async function getImageData(position) {
    try {
        const response = await axios.get(`${baseUrl}/imagedata/${position}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des données de l\'image:', error);
        await removeFirstLine();
        return null;
    }
}

// Fonction pour déterminer la catégorie basée sur les données de l'image
async function getCategory(account) {
    try {
        const response = await axios.get(`${baseUrl}/categorie/${account}`);
        return response.data.category;
    } catch (error) {
       // console.error('Erreur lors de la récupération de la catégorie:', error);
        return 'inconnue';
    }
}

// Fonction pour supprimer la première ligne
async function removeFirstLine() {
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
        
        // Déplacer l'image selon sa catégorie
        const groupe = category 
        
        // Effectuer la requête pour déplacer l'image
        await axios.get(`${baseUrl}/move/${position}/${groupe}`);
        console.log(`Image déplacée vers ${groupe}`);
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
    let valid=await validateImage(position);
    // Boucle infinie pour traiter les images
    while (valid) {
        valid=await validateImage(position);
        position++;
        
        // Délai avant de traiter la prochaine image
        await new Promise(resolve => setTimeout(resolve, delayBetweenImages));
    }
}

// Exécuter le script
main().catch(console.error);
