const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const categoriesmanager = require('./categories');
let downloadImage = require('download-image');
const findMatchingLinks = utils.findMatchingLinks;

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
      //logOperation('loadLinks', startTime, { count: this.links.length });
    } catch (err) {
      console.error('Error loading links:', err);
      //logOperation('loadLinks_error', startTime, { error: err.message });
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
      //logOperation('removeLink', startTime, { link });
    } else {
      //logOperation('removeLink_notFound', startTime, { link });
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
      //logOperation('addLink', startTime, { link });
    } else {
      //logOperation('addLink_duplicate', startTime, { link });
    }
  }

  /**
   * Saves links to file
   */
  saveLinks() {
    const startTime = Date.now();
    try {
      fs.writeFileSync(this.linkFile, this.links.join('\n'));
      //logOperation('saveLinks', startTime, { count: this.links.length });
    } catch (err) {
      console.error('Error saving links:', err);
      //logOperation('saveLinks_error', startTime, { error: err.message });
    }
  }

  /**
   * @returns {string|null} First link or null if no links
   */
  getLink() {
    return this.links.length > 0 ? this.links[0] : null;
  }
}
function saveDownloadInfo(localPath, originalLink) {
    const downloadsFile = path.join(__dirname, './downloads.json');
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
     // logOperation('saveDownloadInfo', Date.now(), { localPath, originalLink });
    } catch (err) {
      console.error('Error saving download info:', err);
      //logOperation('saveDownloadInfo_error', Date.now(), { error: err.message });
    }
  }
const uselink=(link)=>{
    try {
    const account = categoriesmanager.getCategory(findMatchingLinks(link)[0].fileName.split('.')[0]);
    const texte = findMatchingLinks(link)[0].texte;
    const originalLink = link;
    if(!fs.existsSync(path.join(__dirname, './good', ""+account))){
        fs.mkdirSync(path.join(__dirname, './good', ""+account));
    }
    const localPath = path.join(__dirname, './good', ""+account, ""+fs.readdirSync(path.join(__dirname, './good', ""+account)).length+1);
    downloadImage(link, localPath);
    saveDownloadInfo(localPath, originalLink);
    } catch (error) {
        console.error('Error using link:', error);
    }
}
const temp =new LinkManager("C:\\Users\\alpha\\twitter\\urls.txt");
let link = temp.getLink();
while (link) {
    uselink(link);
    temp.removeLink(link);
    link = temp.getLink();
}