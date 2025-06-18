const { spawn } = require('child_process');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fs = require('fs');
const path = require('path');

async function downloadChannels(channelUrls) {
  const videoDir = 'video';
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir);
  }

  // Fichier pour stocker les chaînes déjà téléchargées
  const downloadedChannelsFile = path.join(videoDir, 'downloaded_channels.json');
  let downloadedChannels = {};
  
  // Charger les chaînes déjà téléchargées
  if (fs.existsSync(downloadedChannelsFile)) {
    try {
      downloadedChannels = JSON.parse(fs.readFileSync(downloadedChannelsFile, 'utf8'));
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier des chaînes téléchargées:', error);
    }
  }

  async function downloadChannel(channelUrl) {
    // Vérifier si la chaîne a déjà été téléchargée
    const isDownloaded = downloadedChannels[channelUrl] === true;
    
    // Préparer les arguments pour yt-dlp
    let args = ['-vU', '-f', 'best', '-ciw', '--write-playlist-metafiles', 
      '--parse-metadata', 'playlist_title:.+ - (?P<folder_name>Videos|Shorts|Live)$', 
      '--sleep-requests', '5', '--min-sleep-interval', '9', '--max-sleep-interval', '60', 
      '--cookies-from-browser', 'firefox', 
      '-o', `./video/%(channel|)s/%(folder_name|)s/%(title)s [%(id)s].%(ext)s`];
    fs.writeFileSync("./video/yt-dlp.log",  args.join(" ")); // Réinitialiser le fichier de log
    // Si la chaîne n'a pas été téléchargée, télécharger tous les éléments
    if (!isDownloaded) {
      console.log(`La chaîne ${channelUrl} n'a pas été téléchargée, téléchargement de tous les éléments.`);
    } else {
      console.log(`La chaîne ${channelUrl} a déjà été téléchargée, récupération des 50 derniers éléments uniquement.`);
      args.push('--playlist-end', '50');
    }
    
    // Ajouter l'URL de la chaîne à la fin des arguments
    args.push(channelUrl);
    
    const ytdlp = spawn('ytdlp', args);

    ytdlp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ytdlp.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    ytdlp.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      
      // Marquer la chaîne comme téléchargée
      downloadedChannels[channelUrl] = true;
      
      // Sauvegarder l'état des téléchargements
      fs.writeFileSync(downloadedChannelsFile, JSON.stringify(downloadedChannels, null, 2));
      
      if (channelUrls.length > 0) {
        const nextChannelUrl = channelUrls.shift();
        console.log(`Téléchargement de la chaîne suivante : ${nextChannelUrl}`);
        downloadChannel(nextChannelUrl);
      } else {
        console.log('Tous les téléchargements sont terminés');
      }
    });
  }

  // Séparer les chaînes déjà téléchargées des nouvelles
  const newChannels = channelUrls.filter(url => !downloadedChannels[url]);
  const downloadedChannelsUrls = channelUrls.filter(url => downloadedChannels[url]);

  // Télécharger d'abord les nouvelles chaînes
  if (newChannels.length > 0) {
    const firstNewChannelUrl = newChannels.shift();
    console.log(`Téléchargement de la première chaîne nouvelle : ${firstNewChannelUrl}`);
    downloadChannel(firstNewChannelUrl);
    return
  } else {
    console.log('Aucune nouvelle chaîne à télécharger.');
  }

  // Puis télécharger les chaînes déjà téléchargées pour récupérer les nouveaux éléments
  if (downloadedChannelsUrls.length > 0) {
    const firstDownloadedChannelUrl = downloadedChannelsUrls.shift();
    console.log(`Téléchargement de la première chaîne déjà téléchargée : ${firstDownloadedChannelUrl}`);
    downloadChannel(firstDownloadedChannelUrl);
  } else {
    console.log('Aucune chaîne déjà téléchargée à mettre à jour.');
  }
}

const channelUrls = ['https://www.youtube.com/@Giuliahere',
  'https://www.youtube.com/@squidinkidink',
  'https://www.youtube.com/@nadinebreaty',
  'https://www.youtube.com/@Imthe_annag'
];

downloadChannels(channelUrls);
