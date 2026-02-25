import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceModels() {
    if (modelsLoaded) return;
    if (typeof window === "undefined") return;

    const MODEL_URL = '/models';

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        console.log('Face models loaded successfully');
    } catch (error) {
        console.error('Error loading face models:', error);
        throw error;
    }
}

export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
    if (!modelsLoaded) {
        await loadFaceModels();
    }
    if (typeof window === "undefined") return null;

    // Detect single face using TinyFaceDetector
    const detection = await faceapi.detectSingleFace(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.3
        })
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
        return null;
    }

    if (detection.detection.box.width < 100) {
        throw new Error("Move closer to camera.");
    }

    return detection.descriptor;
}

export function euclideanDistance(desc1: Float32Array, desc2: Float32Array): number {
    return faceapi.euclideanDistance(desc1, desc2);
}

// Compress image function
export function compressImage(canvas: HTMLCanvasElement, quality = 0.8): string {
    return canvas.toDataURL('image/jpeg', quality);
}

// Convert Float32Array to JSON array for Supabase storage
export function descriptorToArray(descriptor: Float32Array): number[] {
    return Array.from(descriptor);
}

// Convert JSON array back to Float32Array from Supabase
export function arrayToDescriptor(arr: number[]): Float32Array {
    return new Float32Array(arr);
}
