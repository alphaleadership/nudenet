const fs = require('fs');
const path = require('path');
let categories;
// Load categories from file
try {
    categories = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
} catch (error) {
    console.error('Error loading categories:', error);
    process.exit(1);
}

// Function to get category for a directory name
function getCategoryForDir(dirName) {
    // Try to find an exact match
    for (const [key, value] of Object.entries(categories)) {
        if (value === dirName) {
            return key;
        }
    }
    
    // Try to find a match without the trailing number
    const baseName = dirName.replace(/\d+$/, '');
    for (const [key, value] of Object.entries(categories)) {
        if (value === baseName) {
            return key;
        }
    }
    
    return 'No category';
}

// Function to count files in a directory
function countFilesInDir(dirPath) {
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        let count = 0;
        
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            
            if (file.isFile()) {
                count++;
            } else if (file.isDirectory()) {
                count += countFilesInDir(filePath);
            }
        }
        
        return count;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return 0;
    }
}

// Function to get subdirectories and their file counts
function getDirectoryStats(baseDir) {
    try {
        const stats = [];
        const files = fs.readdirSync(baseDir, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isDirectory()) {
                const filePath = path.join(baseDir, file.name);
                const fileCount = countFilesInDir(filePath);
                const category = getCategoryForDir(file.name);
                stats.push({
                    directory: file.name,
                    fileCount: fileCount,
                    category: category
                });
            }
        }
        
        return stats;
    } catch (error) {
        console.error('Error getting directory stats:', error);
        return [];
    }
}

// Function to format and print the table
function printDirectoryTable(stats) {
    console.log('\nDirectory Statistics:\n');
    console.log('Directory'.padEnd(20) + 'File Count'.padEnd(10) + 'Category');
    console.log('-'.repeat(40));
    
    stats.sort((a, b) => b.fileCount - a.fileCount).forEach(stat => {
        console.log(stat.directory.padEnd(20) + stat.fileCount.toString().padStart(10) + stat.category);
    });
    
    // Calculate and display total
    const totalFiles = stats.reduce((sum, stat) => sum + stat.fileCount, 0);
    console.log('\nTotal files:'.padEnd(30) + totalFiles.toString().padStart(10));
    
    // Save to CSV file
    const csvContent = stats.map(stat => `${stat.directory},${stat.fileCount},${stat.category}`).join('\n');
    fs.writeFileSync('directory-stats.csv', `Directory,File Count,Category\n${csvContent}`);
    
    // Generate HTML file
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Directory Statistics</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #4CAF50;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .total {
                font-weight: bold;
                background-color: #ddd;
            }
        </style>
    </head>
    <body>
        <h1>Directory Statistics</h1>
        <table>
            <tr>
                <th>Directory</th>
                <th>File Count</th>
                <th>Category</th>
            </tr>
            ${stats.map(stat => `
                <tr>
                    <td>${stat.directory}</td>
                    <td>${stat.fileCount}</td>
                    <td>${stat.category}</td>
                </tr>
            `).join('')}
            <tr class="total">
                <td>Total files:</td>
                <td>${totalFiles}</td>
                <td></td>
            </tr>
        </table>
    </body>
    </html>
    `;
    
    fs.writeFileSync('directory-stats.html', htmlContent);
    console.log('\nSaved directory statistics to directory-stats.html');
    console.log('Generated HTML file with styled table');
}

// Main function
function main() {
    try {
        // Use current directory as base
        const baseDir = __dirname+"/good";
        console.log(`Base directory: ${baseDir}`);
        
        // Get directory statistics
        var stats = getDirectoryStats(baseDir);
        console.log(`Found ${stats.length} subdirectories`);
        
        // Prin t the results
        printDirectoryTable(stats);
    } catch (error) {
        console.error('Error in main function:', error);
        throw error;
    }
}

// Run the program
main()
