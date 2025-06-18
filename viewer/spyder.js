const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
class Database {
  constructor(filename) {
    this.filename = filename;
    this.data = {};
  }

  init() {
    try {
      const data = fs.readFileSync(this.filename, 'utf8');
      this.data = JSON.parse(data);
    } catch (error) {
      fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
    }
  }

  save() {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  }

  addData(key, value) {
    this.data[key] = value;
    this.save();
  }

  addMultipleData(data) {
    Object.assign(this.data, data);
    this.save();
  }
}

const db = new Database('database.json');
db.init();

// Exemple d'utilisation
db.addData('nom', 'John Doe');
db.addMultipleData({ age: 30, ville: 'Paris' });




class Spider {
  constructor(url) {
    this.url = url;
    this.visited = new Set();
    this.data = [];
  }

  async crawl() {
    await this.visit(this.url);
    fs.writeFileSync('data.json', JSON.stringify(this.data, null, 2));
  }

  async visit(url) {
    if (this.visited.has(url)) return;
    this.visited.add(url);

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      console.log(`Visiting ${url}`);

      $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.startsWith('http')) {
          this.data.push({ url: href });
          this.visit(href);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
}

// Exemple d'utilisation
const spider = new Spider('https://example.com');
spider.crawl();





