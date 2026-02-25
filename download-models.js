const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const models = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function downloadModel(filename) {
    const dest = path.join(modelsDir, filename);
    const file = fs.createWriteStream(dest);

    return new Promise((resolve, reject) => {
        https.get(baseUrl + filename, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            console.error(`Error downloading ${filename}:`, err);
            reject(err);
        });
    });
}

async function run() {
    for (const model of models) {
        await downloadModel(model);
    }
    console.log('All models downloaded successfully.');
}

run();
