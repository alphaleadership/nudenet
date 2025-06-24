const fs = require('fs');
const path = require('path');

const categoriesFile = path.join(__dirname, 'categories.json');

/**
 * Loads the categories data from file
 * @returns {Object} Categories data
 */
function loadCategories() {
    try {
        if (!fs.existsSync(categoriesFile)) {
            fs.writeFileSync(categoriesFile, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
    } catch (error) {
        console.error('Error loading categories:', error);
        return {};
    }
}

/**
 * Saves the categories data to file
 * @param {Object} categories - Categories data to save
 */
function saveCategories(categories) {
    try {
        fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error('Error saving categories:', error);
    }
}

/**
 * Gets the category for an account
 * @param {string} account - Account name
 * @returns {number|null} Category number or null if not found
 */
function getCategory(account) {
    const categories = loadCategories();
    
    // If account has no category, assign a default category based on the length
    if (!categories[account]) {
        // Get all existing category numbers
        const existingCategories = Object.values(categories).map(Number);
        
        // Find the next available category number
        let nextCategory = 1;
        while (existingCategories.includes(nextCategory)) {
            nextCategory++;
        }
        
        // Set the category for this account
        setCategory(account, nextCategory);
    }
    
    // Return category as number
    return categories[account] ? Number(categories[account]) : null;
}

/**
 * Sets the category for an account
 * @param {string} account - Account name
 * @param {string} category - Category name
 */
function setCategory(account, category) {
    const categories = loadCategories();
    categories[account] = category;
    saveCategories(categories);
}

/**
 * Removes the category for an account
 * @param {string} account - Account name
 */
function removeCategory(account) {
    const categories = loadCategories();
    delete categories[account];
    saveCategories(categories);
}

module.exports = {
    loadCategories,
    saveCategories,
    getCategory,
    setCategory,
    removeCategory
};
