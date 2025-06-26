const fs = require('fs').promises;
const path = require('path');

async function removeAccount(accountName) {
    try {
        // Vérifier si le fichier database.json existe
        const databasePath = path.join(__dirname, 'downloads.json');
        const databaseExists = await fs.access(databasePath).then(() => true).catch(() => false);
        if (!databaseExists) {
            console.error('Le fichier database.json n\'existe pas');
            return;
        }

        // Lire le fichier database.json
        const database = JSON.parse(await fs.readFile(databasePath, 'utf-8'));

        // Supprimer toutes les entrées correspondant au compte
        const originalCount = Object.keys(database).length;
        const filteredDatabase = 
            database.downloads.filter((entry) => {
                // Supprimer si l'entrée contient le nom du compte dans son chemin
                const pathContainsAccount = entry.account && entry.account.includes(accountName);
                // Supprimer si l'entrée contient le nom du compte dans son titre
                const titleContainsAccount = entry.title && entry.title.includes(accountName);
                
                return !(pathContainsAccount || titleContainsAccount);
            })
        

        const removedCount = originalCount - Object.keys(filteredDatabase).length;
        
        // Sauvegarder les modifications
        await fs.writeFile(databasePath, JSON.stringify({downloads:filteredDatabase}, null, 2));
        
        console.log(`Suppression terminée:`);
        console.log(`- Entrées au départ: ${originalCount}`);
        console.log(`- Entrées supprimées: ${removedCount}`);
        console.log(`- Entrées restantes: ${Object.keys(filteredDatabase).length}`);

    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

// Vérifier les arguments
if (process.argv.length !== 3) {
    console.error('Usage: node remove-account.js <nom_du_compte>');
    process.exit(1);
}

const accountName = process.argv[2];
removeAccount(accountName).catch(console.error);
