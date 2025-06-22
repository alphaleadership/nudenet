const fs = require('fs');
const path = require('path');

const categoriesFile = path.join(__dirname, 'categories.json');

/**
 * Loads the categories data from file
 * @returns {Promise<Object>} Categories data
 */
async function loadCategories() {
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
async function saveCategories(categories) {
    try {
        fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error('Error saving categories:', error);
    }
}

/**
 * Gets the category for an account
 * @param {string} account - Account name
 * @returns {Promise<string|null>} Category name or null if not found
 */
async function getCategory(account) {
    const categories = await loadCategories();
    console.log(categories[account]);
    if(!categories[account]){
        await setCategory(account, categories.length);
    }
    console.log(categories[account]);
    return categories[account];
}

/**
 * Sets the category for an account
 * @param {string} account - Account name
 * @param {string} category - Category name
 */
async function setCategory(account, category) {
    const categories = await loadCategories();
    categories[account] = category;
    await saveCategories(categories);
}

/**
 * Removes the category for an account
 * @param {string} account - Account name
 */
async function removeCategory(account) {
    const categories = await loadCategories();
    delete categories[account];
    await saveCategories(categories);
}

module.exports = {
    loadCategories,
    saveCategories,
    getCategory,
    setCategory,
    removeCategory
};
