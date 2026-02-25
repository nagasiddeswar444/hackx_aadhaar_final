'use client';

import { useEffect, useRef, useState } from 'react';
import { loadFaceModels, getFaceDescriptor, compressImage } from '@/lib/face-api';
import { Camera, AlertCircle } from 'lucide-react';

interface FaceScannerProps {
    onCapture: (data: { imageBase64: string, descriptor: number[], allDescriptors?: number[][] }) => void;
    onError: (err: string) => void;
    buttonText?: string;
    captureMultiple?: boolean;
}

export default function FaceScanner({ onCapture, onError, buttonText = "Capture Face", captureMultiple = false }: FaceScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [processing, setProcessing] = useState(false);

    // To handle React Strict Mode double-calling useEffect
    const initStarted = useRef(false);

    useEffect(() => {
        if (initStarted.current) return;
        initStarted.current = true;

        const initCamera = async () => {
            try {
                setLoadingModels(true);
                await loadFaceModels();
                setLoadingModels(false);

                const s = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: 640,
                        height: 480
                    }
                });
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            } catch (err: any) {
                console.error("Camera/Model setup error:", err);
                onError("Please allow camera access to use this feature.");
                setLoadingModels(false);
            }
        };
        initCamera();

        return () => {
            setStream(currentStream => {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }
                return null;
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current || loadingModels) return;

        setProcessing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== 4) {
            await new Promise<void>(resolve => {
                video.onloadedmetadata = () => resolve();
            });
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const descriptors: number[][] = [];
        let firstImageBase64 = "";

        try {
            const count = captureMultiple ? 3 : 1;
            for (let i = 0; i < count; i++) {
                // Target size specified: 300x300
                canvas.width = 300;
                canvas.height = 300;
                const vW = video.videoWidth;
                const vH = video.videoHeight;
                const minDim = Math.min(vW, vH);
                const sX = (vW - minDim) / 2;
                const sY = (vH - minDim) / 2;

                let descriptor: Float32Array | null = null;
                for (let retry = 0; retry < 3; retry++) {
                    ctx.drawImage(video, sX, sY, minDim, minDim, 0, 0, 300, 300);
                    descriptor = await getFaceDescriptor(canvas);
                    if (descriptor) break;
                    if (retry < 2) await new Promise(r => setTimeout(r, 500));
                }

                if (!descriptor) {
                    throw new Error("No face detected. Please try again.");
                }

                if (descriptor.length !== 128) {
                    throw new Error("Invalid face descriptor detected (length " + descriptor.length + "). Please try again.");
                }

                descriptors.push(Array.from(descriptor));

                if (i === 0) {
                    firstImageBase64 = compressImage(canvas, 0.8);
                }

                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 400)); // wait 400ms between frames
                }
            }

            // Cleanup stream immediately
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            setProcessing(false);
            onCapture({
                imageBase64: firstImageBase64,
                descriptor: descriptors[0],
                allDescriptors: descriptors
            });

        } catch (err: any) {
            console.error(err);
            setProcessing(false);
            onError(err.message || "Face analysis failed.");
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto', background: '#e2e8f0', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary)', marginBottom: '16px' }}>
                {loadingModels ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: 'white', zIndex: 10 }}>
                        <span className="spinner" style={{ marginBottom: '10px', borderWidth: '3px', borderColor: 'rgba(255,255,255,0.2)', borderLeftColor: 'white' }}></span>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>Loading Models...</div>
                    </div>
                ) : !stream && !processing ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: 'white', zIndex: 10, padding: '20px' }}>
                        <AlertCircle size={32} style={{ marginBottom: '10px' }} />
                        <div style={{ fontSize: '12px' }}>Camera unavailable</div>
                    </div>
                ) : null}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ marginTop: '16px' }}>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={captureAndAnalyze}
                    disabled={loadingModels || processing || !stream}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                >
                    {processing ? (
                        <><span className="spinner"></span> Analyzing...</>
                    ) : (
                        <><Camera size={18} /> {buttonText}</>
                    )}
                </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
                Position your face clearly within the frame.<br />Ensure clear lighting and face the camera directly.
            </p>
        </div>
    );
}
