import fs from 'fs';
import https from 'https';
import path from 'path';

const icons = [
  'icon.ico',
  'icon.icns',
  '32x32.png',
  '128x128.png',
  '128x128@2x.png'
];

const baseUrl = 'https://raw.githubusercontent.com/tauri-apps/tauri/1.x/tooling/cli/templates/app/src-tauri/icons/';
const targetDir = path.join(process.cwd(), 'src-tauri', 'icons');

fs.mkdirSync(targetDir, { recursive: true });

Promise.all(icons.map(icon => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(targetDir, icon));
    https.get(baseUrl + icon, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', err => {
      fs.unlinkSync(path.join(targetDir, icon));
      reject(err);
    });
  });
})).then(() => console.log('Icons downloaded successfully!'));
