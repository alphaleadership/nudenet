const fs = require('fs');
const path = require('path');

// Simulation des chemins du projet
const PROJECT_ROOT = path.resolve(__dirname);
const MEDIA_DIR = path.join(PROJECT_ROOT, 'media');
const GOOD_DIR = path.join(PROJECT_ROOT, 'good');
const DEL_DIR = path.join(PROJECT_ROOT, 'del');
const URLS_FILE = 'C:\\Users\\alpha\\twitter\\urls.txt';
const categoriesmanager = require('./categories');
// Simulation de la base de données des catégories
let categories = {
    // Format: { "account": category_number }
};

// Simulation des opérations sur les fichiers
function simulateFileMove(sourcePath, targetDir) {
    try {
        const fileName = path.basename(sourcePath);
        const targetPath = path.join(targetDir, fileName);
        
        // Simuler le déplacement du fichier
        console.log(`Simulating move: ${sourcePath} -> ${targetPath}`);
        
        // Mettre à jour downloads.json
        const downloadsFile = path.join(PROJECT_ROOT, 'downloads.json');
        if (fs.existsSync(downloadsFile)) {
            const downloads = JSON.parse(fs.readFileSync(downloadsFile, 'utf8'));
            const download = downloads.downloads.find(d => d.localPath === sourcePath);
            if (download) {
                download.localPath = targetPath;
                fs.writeFileSync(downloadsFile, JSON.stringify(downloads, null, 2));
                console.log('Updated downloads.json with new file path');
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error simulating file move:', error);
        return false;
    }
}

// Simulation de la validation d'image
async function simulateValidateImage(position) {
    try {
        console.log(`\nSimulating validation for image ${position}`);
        
        // Simuler la récupération des données de l'image
        const files = fs.readdirSync(MEDIA_DIR);
        const imageFile = files[position];
        const imagePath = path.join(MEDIA_DIR, imageFile);
        
        if (!imageFile) {
            console.log('No image found at position', position);
            return false;
        }

        // Simuler la récupération de la catégorie
        const account = imageFile.split('.')[0]; // Simuler l'extraction du nom du compte
        const category = categories[account] || Math.floor(Math.random() * 10); // Simuler une catégorie aléatoire
        console.log(`Simulated category: ${category} for account ${account}`);
        
        // Simuler le déplacement du fichier selon la catégorie
        const targetDir = category >= 5 ? GOOD_DIR : DEL_DIR;
        const success = simulateFileMove(imagePath, targetDir);
        
        // Simuler la suppression de la première ligne du fichier urls.txt
        if (fs.existsSync(URLS_FILE)) {
            const lines = fs.readFileSync(URLS_FILE, 'utf8').split('\n');
            if (lines.length > 0) {
                lines.shift();
                fs.writeFileSync(URLS_FILE, lines.join('\n'));
                console.log('Simulated removal of first line from urls.txt');
            }
        }
        
        return success;
    } catch (error) {
        console.error('Error during simulation:', error);
        return false;
    }
}

// Simulation de la boucle principale
async function simulateMain() {
    console.log('=== Simulation de la validation des images ===');
    console.log(`Starting in directory: ${MEDIA_DIR}`);
    
    // Initialiser les catégories avec des valeurs aléatoires
    const files = fs.readdirSync(MEDIA_DIR);
    files.forEach(file => {
        const account = file.split('.')[0];
        categories[account] = Math.floor(Math.random() * 10);
    });
    
    // Simuler la validation des images
    let position = 0;
    let valid = await simulateValidateImage(position);
    
    // Simuler une boucle de validation
    while (valid && position < files.length) {
        position++;
        valid = await simulateValidateImage(position);
    }
    
    console.log('\n=== Simulation terminée ===');
    console.log('Statistiques de simulation:');
    console.log(`Nombre total d'images: ${files.length}`);
    console.log(`Nombre de catégories simulées: ${Object.keys(categories).length}`);
}

// Démarrer la simulation
simulateMain();
