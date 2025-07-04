const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { findMatchingLinks } = require('../utils');
const { getCategory, setCategory, removeCategory, loadCategories } = require('../categories');

// Create category router
const categoryRouter = express.Router();

// Get category for an account
categoryRouter.get('/:account', (req, res) => {
  try {
    const account = req.params.account;
    const category = getCategory(account);
    console.log(category);
    res.json({ category });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ error: 'Error getting category' });
  }
});

// Set category for an account
categoryRouter.post('/:account', (req, res) => {
  try {
    const account = req.params.account;
    const { category } = req.body;
    setCategory(account, category);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting category:', error);
    res.status(500).json({ error: 'Error setting category' });
  }
});

// Remove category for an account
categoryRouter.delete('/:account', (req, res) => {
  try {
    const account = req.params.account;
    removeCategory(account);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing category:', error);
    res.status(500).json({ error: 'Error removing category' });
  }
});

// Mount category router
router.use('/categorie', categoryRouter);

// Add downloads directory
const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

/**
 * Saves image download information to JSON file
 * @param {string} localPath - Local path where image was saved
 * @param {string} originalLink - Original URL of the image
 */
function saveDownloadInfo(localPath, originalLink) {
  const downloadsFile = path.join(__dirname, '../downloads.json');
  let downloads = [];
  
  try {
    if (fs.existsSync(downloadsFile)) {
      const data = fs.readFileSync(downloadsFile, 'utf8');
      downloads = JSON.parse(data).downloads;
    }
    
    downloads.push({
      localPath,
      originalLink,
      timestamp: new Date().toISOString(),
      account: findMatchingLinks(originalLink)[0].fileName.split('.')[0],
      texte:findMatchingLinks(originalLink)[0].texte
    });
    
    fs.writeFileSync(downloadsFile, JSON.stringify({ downloads }, null, 2));
    logOperation('saveDownloadInfo', Date.now(), { localPath, originalLink });
  } catch (err) {
    console.error('Error saving download info:', err);
    logOperation('saveDownloadInfo_error', Date.now(), { error: err.message });
  }
}

/**
 * Updates downloads.json when a file is moved
 * @param {string} oldPath - Original file path
 * @param {string} newPath - New file path
 */
function updateDownloadsOnMove(oldPath, newPath) {
  const downloadsFile = path.join(__dirname, '../downloads.json');
  try {
    if (fs.existsSync(downloadsFile)) {
      const data = fs.readFileSync(downloadsFile, 'utf8');
      const downloads = JSON.parse(data).downloads;
      
      // Find and update the record with the old path
      const updatedDownloads = downloads.map(download => {
      //  console.log(download)
        if (download.localPath === oldPath) {
          return { ...download, localPath: newPath};
        }else{
          return { ...download};
        }
      });
      
      // Save the updated downloads
      fs.writeFileSync(downloadsFile, JSON.stringify({ downloads: updatedDownloads }, null, 2));
      logOperation('updateDownloadsOnMove', Date.now(), { 
        oldPath, 
        newPath 
      });
    }
  } catch (err) {
    console.error('Error updating downloads on move:', err);
    logOperation('updateDownloadsOnMove_error', Date.now(), { 
      error: err.message,
      oldPath,
      newPath
    });
  }
}

/**
 * Removes an entry from downloads.json when a file is deleted
 * @param {string} filePath - Path of the deleted file
 */
function removeDownloadEntry(filePath) {
  const downloadsFile = path.join(__dirname, '../downloads.json');
  try {
    if (fs.existsSync(downloadsFile)) {
      const data = fs.readFileSync(downloadsFile, 'utf8');
      const downloads = JSON.parse(data).downloads;
      
      // Filter out the deleted file's entry
      const updatedDownloads = downloads.filter(download => download.localPath !== filePath);
      
      // Save the updated downloads
      fs.writeFileSync(downloadsFile, JSON.stringify({ downloads: updatedDownloads }, null, 2));
      logOperation('removeDownloadEntry', Date.now(), { 
        filePath 
      });
    }
  } catch (err) {
    console.error('Error removing download entry:', err);
    logOperation('removeDownloadEntry_error', Date.now(), { 
      error: err.message,
      filePath
    });
  }
}

// Directory paths
const imageDirectory = path.join(__dirname, '../media');
const goodDirectory = path.join(__dirname, '../good');
const delDirectory = path.join(__dirname, '../del');

// Get all directories route
router.get('/directories', (req, res) => {
  try {
    const allDirs = fs.readdirSync(goodDirectory).filter(dir => 
      fs.statSync(path.join(goodDirectory, dir)).isDirectory()
    );
    
    // Sort directories alphabetically
    allDirs.sort();
    
    res.json({ directories: allDirs });
  } catch (error) {
    console.error('Error getting directories:', error);
    res.status(500).json({ error: 'Error getting directories' });
  }
});

// Get next directory route
router.get('/next-directory/:currentDir', (req, res) => {
  try {
    const currentDir = req.params.currentDir;
    const allDirs = fs.readdirSync(goodDirectory).filter(dir => 
      fs.statSync(path.join(goodDirectory, dir)).isDirectory()
      && fs.readdirSync(path.join(goodDirectory, dir)).length > 0
    );
    
    // Sort directories alphabetically
    allDirs.sort((a, b) => {
      const dirA = parseInt(a.toLowerCase());
      const dirB = parseInt(b.toLowerCase());
      if (dirA < dirB) return -1;
      if (dirA > dirB) return 1;
      return 0;
    });
    
    // Find current index and get next directory
    const currentIndex = allDirs.indexOf(currentDir);
    const nextIndex = currentIndex < allDirs.length - 1 ? currentIndex + 1 : 0;
    const nextDir = allDirs[nextIndex];
    
    res.json({ nextDir });
  } catch (error) {
    console.error('Error getting next directory:', error);
    res.status(500).json({ error: 'Error getting next directory' });
  }
});

const urlsDir = path.join(__dirname, '../accepted_urls');
const logDirectory = path.join(__dirname, '../logs');

// Ensure necessary directories exist
for (const dir of [goodDirectory, delDirectory, urlsDir, logDirectory]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let mode = 'image';
let dernierFichierParCategorie = {};
let fileCount = {};

/**
 * Logs operations with execution time
 * @param {string} operation - Operation description
 * @param {number} startTime - Start time in milliseconds
 * @param {Object} additionalInfo - Additional information to log
 */
function logOperation(operation, startTime, additionalInfo = {}) {
  const endTime = Date.now();
  const duration = endTime - startTime;

  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    duration: `${duration}ms`,
    ...additionalInfo
      };

  const logFileName = `operations_${new Date().toISOString().split('T')[0]}.log`;
  const logPath = path.join(logDirectory, logFileName);

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  console.log(`[LOG] ${operation} - ${duration}ms`, additionalInfo);
}

/**
 * Manages links from a file
 */
class LinkManager {
  /**
   * @param {string} linkFile - Path to the file containing links
   */
  constructor(linkFile) {
    this.linkFile = linkFile;
    this.links = [];
    this.loadLinks();
  }

  /**
   * Loads links from file
   */
  loadLinks() {
    const startTime = Date.now();
    try {
      const linkData = fs.readFileSync(this.linkFile, 'utf8');
      this.links = [...new Set(linkData.split('\n')
        .filter(line => line !== '\r')
        .filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));
      logOperation('loadLinks', startTime, { count: this.links.length });
    } catch (err) {
      console.error('Error loading links:', err);
      logOperation('loadLinks_error', startTime, { error: err.message });
    }
  }

  /**
   * @returns {string[]} Array of links
   */
  getLinks() {
    return this.links;
  }

  /**
   * @param {string} link - Link to remove
   */
  removeLink(link) {
    const startTime = Date.now();
    const index = this.links.indexOf(link);
    if (index !== -1) {
      this.links.splice(index, 1);
      this.saveLinks();
      logOperation('removeLink', startTime, { link });
    } else {
      logOperation('removeLink_notFound', startTime, { link });
    }
  }

  /**
   * @param {string} link - Link to add
   */
  addLink(link) {
    const startTime = Date.now();
    if (!this.links.includes(link)) {
      this.links.push(link);
      this.saveLinks();
      logOperation('addLink', startTime, { link });
    } else {
      logOperation('addLink_duplicate', startTime, { link });
    }
  }

  /**
   * Saves links to file
   */
  saveLinks() {
    const startTime = Date.now();
    try {
      fs.writeFileSync(this.linkFile, this.links.join('\n'));
      logOperation('saveLinks', startTime, { count: this.links.length });
    } catch (err) {
      console.error('Error saving links:', err);
      logOperation('saveLinks_error', startTime, { error: err.message });
    }
  }

  /**
   * @returns {string|null} First link or null if no links
   */
  getLink() {
    return this.links.length > 0 ? this.links[0] : null;
  }
}

// Initialize link manager
const linkFile = "C:\\Users\\alpha\\twitter\\urls.txt";
const linkManager = new LinkManager(linkFile);

/**
 * Groups files by name prefix and sorts by number
 * @param {string[]} files - Array of filenames
 * @returns {string[]} Array of grouped and sorted filenames
 */
function regroupFiles(files) {
  const startTime = Date.now();
  const fileGroups = {};

  // Group files by prefix
  for (const file of files) {
    const parts = file.split('-');
    const name = parts[0];
    const number = parts.length > 1 ? parseInt(parts[parts.length - 1]) : 0;

    if (parts.length > 1 && number !== 0) {
      if (!fileGroups[name]) {
        fileGroups[name] = [];
      }
      fileGroups[name].push({ file, number });
    } else {
      const filePath = path.join(imageDirectory, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  // Sort groups by number
  const sortedGroups = Object.values(fileGroups).map(group =>
    group.sort((a, b) => a.number - b.number)
  );

  // Update last file number per category
  dernierFichierParCategorie = {};
  for (const group of sortedGroups) {
    if (group.length > 0) {
      const groupName = group[0].file.split('-')[0];
      dernierFichierParCategorie[groupName] = group[group.length - 1].number;
    }
  }

  // Flatten groups to file array
  const result = sortedGroups.flatMap(group => group.map(obj => obj.file));
  logOperation('regroupFiles', startTime, {
    inputCount: files.length,
    outputCount: result.length,
    categories: Object.keys(fileGroups).length
  });
  return result;
}

/**
 * Checks current mode and switches if necessary
 */
function checkAndSwitchMode() {
  const startTime = Date.now();
  const oldMode = mode;
  console.log(linkManager.getLink())
  if (mode === 'image') {
    const files = fs.readdirSync(imageDirectory);
    const regroupedFiles = regroupFiles(files);
    if (!regroupedFiles || regroupedFiles.length === 0) {
      mode = 'lien';
    }
  } else if (mode === 'lien') {
    if (!linkManager.getLink()) {
      mode = 'image';
    }
  }

  logOperation('checkAndSwitchMode', startTime, {
    oldMode,
    newMode: mode,
    switched: oldMode !== mode
  });
}

// Function to get gallery data
function getGalleryData() {
  try {
    const folders = fs.readdirSync(goodDirectory);
    const foldersData = folders.map(folder => {
      const folderPath = path.join(goodDirectory, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const images = fs.readdirSync(folderPath);
        const imagePaths = images.map(img => {
          const fullPath = path.join(folderPath, img);
          const originalLink = getOriginalLinkFromDownloads(fullPath);
          const account = getAccountFromDownloads(fullPath);
          return {
            path: path.join('/good', folder, img),
            originalLink: originalLink,
            account: account
          };
        });

        // Helper function to get account from downloads.json
        function getAccountFromDownloads(filePath) {
          try {
            const downloadsPath = path.join(__dirname, '../downloads.json');
            const downloadsData = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
            const download = downloadsData.downloads.find(d => d.localPath === filePath);
            return download ? download.account : null;
          } catch (error) {
            console.error('Error reading downloads.json:', error);
            return null;
          }
        }
        return { folder, images: imagePaths };
      }
      return null;
    });
    return foldersData.filter(Boolean);
  } catch (error) {
    console.error('Error getting gallery data:', error);
    return [];
  }
}

// Helper function to get original link from downloads.json
function getOriginalLinkFromDownloads(filePath) {
  try {
    const downloadsPath = path.join(__dirname, '../downloads.json');
    const downloadsData = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
    const download = downloadsData.downloads.find(d => d.localPath === filePath);
    return download ? download.originalLink : null;
  } catch (error) {
    console.error('Error reading downloads.json:', error);
    return null;
  }
}
// CORS and cache control middleware
router.all('*', (req, res, next) => {
  const startTime = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  logOperation('middleware', startTime, {
    path: req.path,
    method: req.method,
    ip: (req.header("x-client-ip")||req.ip).toString()
  });

  next();
});

// Main route
router.get('/', (req, res) => {
  const startTime = Date.now();
  checkAndSwitchMode();
  res.render("index");
  logOperation('renderIndex', startTime, { mode });
});

// Slideshow route
router.get('/slideshow/:dir', (req, res) => {
  const startTime = Date.now();
  checkAndSwitchMode();
  const dir = decodeURIComponent(req.params.dir);
  const dirPath = path.join(goodDirectory, dir);

  try {
    const files = fs.readdirSync(dirPath).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).join(',');

    res.render("slideshow", { 
      files, 
      dir
    });
    logOperation('renderSlideshow', startTime, { 
      dir, 
      filesCount: files.length 
    });
  } catch (err) {
    logOperation('renderSlideshow_error', startTime, { 
      error: err.message,
      dir
    });
    res.status(404).json({ error: 'Directory not found or error reading files' });
  }
});

// Gallery route
router.get('/gallery', async (req, res) => {
  const startTime = Date.now();
  try {
    const galleryData = await getGalleryData();
    res.render('gallery', { 
      title: 'Gallery',
      folders: galleryData 
    });
    logOperation('renderGallery', startTime, { foldersCount: galleryData.length });
  } catch (err) {
    console.error('Error rendering gallery:', err);
    logOperation('gallery_error', startTime, { error: err.message });
    res.status(500).send('Server error');
  }
});

// Gallery API route for fetching data
router.get('/api/gallery', async (req, res) => {
  const startTime = Date.now();
  try {
    const galleryData = await getGalleryData();
    res.json(galleryData);
    logOperation('apiGallery', startTime, { foldersCount: galleryData.length });
  } catch (err) {
    console.error('Error getting gallery data:', err);
    logOperation('apiGallery_error', startTime, { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get current image for slideshow
// No longer needed since we handle everything client-side
// router.get('/slideshow/:files/current/:position', (req, res) => {
//   const startTime = Date.now();
//   try {
//     const position = parseInt(req.params.position);
//     const files = decodeURIComponent(req.params.files).split(',');
//     
//     if (position < 0 || position >= files.length) {
//       res.status(404).json({ error: 'Position out of bounds' });
//       return;
//     }

//     const currentFile = files[position];
//     const imagePath = path.join(goodDirectory, currentFile);
//     
//     // Only send the current image path
//     res.json({
//       image: currentFile,
//       position,
//       total: files.length
//     });
//     
//     logOperation('slideshow_current', startTime, { 
//       position, 
//       total: files.length
//     });
//   } catch (err) {
//     logOperation('slideshow_error', startTime, { 
//       error: err.message
//     });
//     res.status(500).json({ 
//       error: 'Error fetching slideshow image', 
//       details: err.message 
//     });
//   }
// });

// Delete image route
router.post('/delete-image', async (req, res) => {
  const startTime = Date.now();
  try {
    const { folder, image } = req.body;
    
    if (!folder || !image) {
      return res.status(400).json({ error: 'Folder and image are required' });
    }

    const imagePath = path.join(goodDirectory, folder, path.basename(image));
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      logOperation('deleteImage', startTime, { image: imagePath });
      res.json({ success: true });
    } else {
      logOperation('deleteImage_notFound', startTime, { image: imagePath });
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (err) {
    console.error('Error deleting image:', err);
    logOperation('deleteImage_error', startTime, { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Image route
router.get('/image/:position', (req, res) => {
  const startTime = Date.now();
  try {
    const files = fs.readdirSync(imageDirectory).filter(file => {
      const fullPath = path.join(imageDirectory, file);
      return fs.statSync(fullPath).isFile();
    });
    const regroupedFiles = regroupFiles(files);

    if (!regroupedFiles || regroupedFiles.length === 0) {
      logOperation('image_notFound', startTime);
      return res.status(404).send('No image found');
    }

    const position = parseInt(req.params.position);
    if (position >= 0) {
      const selectedFile = regroupedFiles[0];
      const filePath = path.join(imageDirectory, selectedFile);
      
      // Save download info if the request includes a download parameter
      if (req.query.download) {
        const originalLink = req.query.originalLink || `file://${filePath}`;
        saveDownloadInfo(filePath, originalLink);
      }
      
      // Set cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.sendFile(filePath);
      logOperation('image_served', startTime, { file: selectedFile });
      logOperation('servingImage', startTime, { selectedFile});
    } else {
      res.status(404).send('Image not found');
      logOperation('image_not_found', startTime, { position });
    }
  } catch (err) {
    console.error('Error reading image directory:', err);
    logOperation('image_error', startTime, { error: err.message });
    res.status(500).send('Server error');
  }
});

// Move image route
router.get('/move/:position/:groupe', (req, res) => {
  const startTime = Date.now();
  try {
    if (mode === "image") {
      const files = fs.readdirSync(imageDirectory).filter(file => {
        const fullPath = path.join(imageDirectory, file);
        return fs.statSync(fullPath).isFile();
      });
      const regroupedFiles = regroupFiles(files);

      if (!regroupedFiles || regroupedFiles.length === 0) {
        logOperation('move_noImageFound', startTime);
        return res.status(404).send('No image found');
      }

      const imageName = regroupedFiles[0];
      const imagePath = path.join(imageDirectory, imageName);
      const category = imageName.split("-")[0];
      const groupe = req.params.groupe;

      // Créer le dossier du groupe s'il n'existe pas
      const groupeDir = path.join(goodDirectory, groupe);
      if (!fs.existsSync(groupeDir)) {
        fs.mkdirSync(groupeDir, { recursive: true });
      }

      // Obtenir le prochain numéro pour la catégorie dans ce groupe
      const filesInGroupeDir = fs.readdirSync(groupeDir);
      const categoryFiles = filesInGroupeDir.filter(file => file.startsWith(category));
      const maxCount = categoryFiles.length === 0 ? 1 :
        Math.max(...categoryFiles.map(file => {
          const parts = file.split('-');
          return parseInt(parts[1].split('.')[0]) || 0;
        })) + 1;

      const newFileName = `${category}-${maxCount}${path.extname(imagePath)}`;
      const newPath = path.join(groupeDir, newFileName);

      // Update downloads.json with the new path before moving the file
      updateDownloadsOnMove(imagePath, newPath);
      
      // Déplacer le fichier
      fs.renameSync(imagePath, newPath);

      // Sauvegarder l'URL associée si elle existe
      try {
        const dbPath = path.join(__dirname, '../../../twitter/baseDonnees.json');
        if (fs.existsSync(dbPath)) {
          const urlsData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

          const imageUrl = urlsData.find(item => {
            return item.nomFichier.split("/").pop() === imageName;
          });

          if (imageUrl) {
            const fileContent = fs.readFileSync(newPath);
            const hash = crypto.createHash('md5').update(fileContent).digest('hex');
            const urlFilePath = path.join(urlsDir, `${hash}.txt`);

            fs.writeFileSync(urlFilePath, JSON.stringify(imageUrl, null, 2));
            logOperation('savedImageUrl', startTime, {
              imageName,
              hash,
              url: imageUrl.url,
              groupe
            });
          }
        }
      } catch (dbErr) {
        console.error('Error reading URL database:', dbErr);
        logOperation('urlDatabase_error', startTime, { error: dbErr.message });
      }

      logOperation('moveImage', startTime, {
        from: imagePath,
        to: newPath,
        category,
        groupe,
        count: maxCount
      });

    } else if (mode === "lien") {
      const link = linkManager.getLink();
      if (!link) {
        logOperation('move_noLinkFound', startTime);
        return res.status(404).send('No link found');
      }

      const category = "twitter";
      const groupe = req.params.groupe;
      
      // Créer le dossier du groupe s'il n'existe pas
      const groupeDir = imageDirectory;
      if (!fs.existsSync(groupeDir)) {
        fs.mkdirSync(groupeDir, { recursive: true });
      }

      regroupFiles(fs.readdirSync(groupeDir));
      const existingCount = (fileCount[category] || 0) + 1;
      const newFileName = `${category}-${existingCount}.jpg`;
      const newFilePath = path.join(groupeDir, newFileName);
    
      try {
        saveDownloadInfo(newFilePath, link);
        const curlCommand = `curl -o "${newFilePath}" "${link}"`;
        exec(curlCommand, (error) => {
          if (error) {
            console.error(`Download error: ${error}`);
            logOperation('downloadImage_error', startTime, {
              link,
              error: error.message,
              groupe
            });
          } else {
            logOperation('downloadImage', startTime, {
              link,
              filePath: newFilePath,
              groupe
            });
          }
        });
        
        linkManager.removeLink(link);
        fileCount[category] = existingCount;
      } catch (error) {
        linkManager.removeLink(link);
        fileCount[category] = existingCount;
        console.error('Error saving download info:', error);
      }

      if (linkManager.getLinks().length === 0) {
        mode = 'image';
      }

      logOperation('processLink', startTime, {
        link,
        newFileName,
        category,
        groupe,
        count: existingCount
      });
    }

    checkAndSwitchMode();
    res.send('File moved successfully');
  } catch (err) {
    console.error('Error moving file:', err);
    logOperation('move_error', startTime, { error: err.message });
    res.status(500).send('Server error');
  }
});

// Delete image/link route
router.get('/delete/:position', (req, res) => {
  const startTime = Date.now();
  try {
    if (mode === "image") {
      const files = fs.readdirSync(imageDirectory).filter(file => {
        const fullPath = path.join(imageDirectory, file);
        return fs.statSync(fullPath).isFile();
      });
      const regroupedFiles = regroupFiles(files);

      if (!regroupedFiles || regroupedFiles.length === 0) {
        logOperation('delete_noImageFound', startTime);
        return res.status(404).send('No image found');
      }

      const imageName = regroupedFiles[0];
      const imagePath = path.join(imageDirectory, imageName);

      if (fs.existsSync(imagePath)) {
        // Remove the entry from downloads.json before deleting the file
        removeDownloadEntry(imagePath);
        fs.unlinkSync(imagePath);
        logOperation('deleteImage', startTime, { imageName, imagePath });
      } else {
        logOperation('deleteImage_notFound', startTime, { imageName, imagePath });
      }
    } else if (mode === "lien") {
      const link = linkManager.getLink();
      if (link) {
        linkManager.removeLink(link);
        logOperation('deleteLink', startTime, { link });
      } else {
        logOperation('deleteLink_notFound', startTime);
      }
    }

    // Check if mode needs to be switched
    checkAndSwitchMode();

    res.send('Successfully deleted');
  } catch (err) {
    console.error('Error deleting file:', err);
    logOperation('delete_error', startTime, { error: err.message });
    res.status(500).send('Server error');
  }
});

// Image data route
router.get('/imagedata/:position', (req, res) => {
  const startTime = Date.now();
  try {
    linkManager.loadLinks();
    checkAndSwitchMode();

    let imageInfo = {};

    if (mode === "image") {
      const files = fs.readdirSync(imageDirectory).filter(file => {
        const fullPath = path.join(imageDirectory, file);
        return fs.statSync(fullPath).isFile();
      });
      const regroupedFiles = regroupFiles(files);

      if (!regroupedFiles || regroupedFiles.length === 0) {
        logOperation('imagedata_noImageFound', startTime);
        return res.status(404).send('No image found');
      }

      const imageName = regroupedFiles[0];
      const imagePath = path.join(imageDirectory, imageName);
      let imageSize = 0;

      if (fs.existsSync(imagePath)) {
        const stats = fs.statSync(imagePath);
        imageSize = stats.size;
      }

      try {
        const downloadsData = require("../downloads.json").downloads;
        const download = downloadsData.find(item => item.localPath === imagePath);
        const account = download ? findMatchingLinks(download.originalLink)[0].fileName.split('.')[0] : null;
        const originalLink = download ? download.originalLink : null;

        imageInfo = {
          nom: imageName,
          taille: imageSize,
          nb: regroupedFiles.length,
          src: `/image/${regroupedFiles.length}`,
          link: `/image/${regroupedFiles.length}`,
          alt: imageName,
          title: imageName,
          account: account,
          originalLink: originalLink
        };
        logOperation('getImageData', startTime, {
          imageName,
          imageSize,
          totalImages: regroupedFiles.length
        });
      } catch (error) {
        const link = linkManager.getLink();
        if (link) {
          linkManager.removeLink(link);
          logOperation('deleteLink', startTime, { link });
        } else { 
          logOperation('deleteLink_notFound', startTime);
        }
        console.error('Error getting image data:', error);
        logOperation('imagedata_error', startTime, { error: error.message });
        return res.status(500).send('Server error');
      }

    } else if (mode === "lien") {
      const link = linkManager.getLink();

      if (!link) {
        logOperation('imagedata_noLinkFound', startTime);
        return res.status(404).send('No link found');
      }

      imageInfo = {
        nom: "Link",
        taille: link.length,
        nb: linkManager.getLinks().length,
        src: link,
        link: link,
        alt: "Link preview",
        title: "Link",
        account: findMatchingLinks(link)[0].fileName.split('.')[0],
        originalLink: link
      };
      logOperation('getLinkData', startTime, {
        link,
        totalLinks: linkManager.getLinks().length
      });
    }

    res.send(imageInfo);
  } catch (err) {
    console.error('Error getting image data:', err);
    logOperation('imagedata_error', startTime, { error: err.message });
    res.status(500).send('Server error');
  }
});

// Delete category route
router.get('/supprimer-categorie/:nom', (req, res) => {
  const startTime = Date.now();
  try {
    const nom = req.params.nom;
    const files = fs.readdirSync(imageDirectory).filter(file => {
      const fullPath = path.join(imageDirectory, file);
      return fs.statSync(fullPath).isFile();
    });;
    const regroupedFiles = regroupFiles(files);

    if (!regroupedFiles || regroupedFiles.length === 0) {
      logOperation('deleteCategory_noImageFound', startTime, { category: nom });
      return res.status(404).send('No image found');
    }

    // Delete all files in the category
    const filesToRemove = regroupedFiles.filter(file => file.split('-')[0] === nom);
    for (const file of filesToRemove) {
      const filePath = path.join(imageDirectory, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    logOperation('deleteCategory', startTime, {
      category: nom,
      filesRemoved: filesToRemove.length
    });

    // Check if mode needs to be switched
    checkAndSwitchMode();

    res.send(`Category ${nom} deleted successfully`);
  } catch (err) {
    console.error('Error deleting category:', err);
    logOperation('deleteCategory_error', startTime, {
      category: req.params.nom,
      error: err.message
    });
    res.status(500).send('Server error');
  }
});

module.exports = router;