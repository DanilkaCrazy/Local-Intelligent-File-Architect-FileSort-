import { Jimp } from 'jimp';

async function createIcon() {
  try {
    // Create a 1024x1024 image with a blue background (#2563EB)
    const image = new Jimp({ width: 1024, height: 1024, color: 0xff2563eb });
    
    // Save it as app-icon.png
    await image.write('app-icon.png');
    console.log('Successfully generated app-icon.png');
  } catch (err) {
    console.error('Error generating icon:', err);
    process.exit(1);
  }
}

createIcon();
