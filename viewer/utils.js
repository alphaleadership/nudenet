const fs = require('fs');
const path = require('path');

/**
 * Searches for objects in JSON files where the 'lien' property matches the originalLink
 * @param {string} originalLink - The original link to search for
 * @param {string} jsonDir - Directory containing JSON files
 * @returns {Object[]} Array of matching objects found in JSON files
 */
function    findMatchingLinks(originalLink, jsonDir = 'C:\\Users\\alpha\\twitter') {
    //console.log(originalLink)
    try {
        const matchingObjects = [];
        
        // Read only tweet.json
        const filePath = path.join(jsonDir, 'tweet.json');
        if (!fs.existsSync(filePath)) {
            console.log('tweet.json not found');
            return [];
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Search through each object in the JSON file
        for (const obj of jsonData) {
            // Check if the object has a media array
            if (obj.media && Array.isArray(obj.media)) {
                // Search through media array for matching links
                //console.log(obj.media)
                const matchingMedia = obj.media.filter(media => 
                    media.lien === originalLink 
                );
                
                if (matchingMedia.length > 0) {
                    // Add matching objects with their file name
                    //console.log(obj.compte)
                    matchingObjects.push({
                        fileName: obj.compte,
                        texte:obj.texte,
                        object: obj,
                        matchingMedia: matchingMedia
                    });
                }
            }
        }
        
        return matchingObjects;
    } catch (error) {
        console.error('Error searching tweet.json:', error);
        return [];
    }
}

module.exports = {
    findMatchingLinks
};
