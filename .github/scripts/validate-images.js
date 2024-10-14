const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGE_SPECS = {
  format: 'png',
  icon: {
    aspectRatio: 1,
    size: 256,
    hdpiSize: 512,
  },
  logo: {
    minSize: 128,
    maxSize: 256,
    hdpiMinSize: 256,
    hdpiMaxSize: 512,
  },
};

async function validateImage(filePath) {
  const { width, height, format } = await sharp(filePath).metadata();

  if (format !== IMAGE_SPECS.format) {
    throw new Error(`${filePath} must be in PNG format.`);
  }

  const aspectRatio = width / height;
  if (filePath.includes('icon')) {
    if (aspectRatio !== IMAGE_SPECS.icon.aspectRatio) {
      throw new Error(`Icon ${filePath} must have a 1:1 aspect ratio.`);
    }
    if (width !== IMAGE_SPECS.icon.size && width !== IMAGE_SPECS.icon.hdpiSize) {
      throw new Error(`Icon ${filePath} must be 256x256 or 512x512 pixels.`);
    }
  } else if (filePath.includes('logo')) {
    const minSize = width < height ? width : height;
    const maxSize = width < height ? height : width;

    const isHDPI = minSize >= IMAGE_SPECS.logo.hdpiMinSize && maxSize <= IMAGE_SPECS.logo.hdpiMaxSize;
    const isNormalDPI = minSize >= IMAGE_SPECS.logo.minSize && maxSize <= IMAGE_SPECS.logo.maxSize;

    if (!isHDPI && !isNormalDPI) {
      throw new Error(`Logo ${filePath} must be at least 128px (256px for hDPI) and at most 256px (512px for hDPI).`);
    }
  }

  console.log(`${filePath} passed validation.`);
}

function findImages(dir, ext = '.png') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findImages(file, ext));
    } else if (path.extname(file).toLowerCase() === ext) {
      results.push(file);
    }
  });
  return results;
}

(async () => {
  try {
    const images = findImages('./'); 
    if (images.length === 0) {
      console.log('No PNG images found.');
      return;
    }

    for (const image of images) {
      await validateImage(image);
    }
  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    process.exit(1);
  }
})();
