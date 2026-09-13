import { useState, useRef, useEffect, useCallback } from 'react';
import { GPSLocation, StampSettings } from '../types';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');
  const [showGrid, setShowGrid] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsStreaming(true);
        };
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as { torch?: boolean } | undefined;
        setHasTorch(!!capabilities?.torch);
      }
    } catch (err) {
      const error = err as Error;
      console.warn('Camera access failed:', error.message);
      setCameraError(
        error.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : error.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${error.message}`
      );
      setIsStreaming(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: nextTorch }] });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  }, [hasTorch, torchOn]);

  const capturePhoto = useCallback(
    async (location: GPSLocation | null, settings: StampSettings): Promise<string | null> => {
      if (!videoRef.current || !isStreaming) return null;

      const video = videoRef.current;
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;

      const canvas = document.createElement('canvas');

      // Adjust dimensions for selected aspect ratio
      let sX = 0;
      let sY = 0;
      let sWidth = vWidth;
      let sHeight = vHeight;

      if (aspectRatio === '1:1') {
        const size = Math.min(vWidth, vHeight);
        sX = (vWidth - size) / 2;
        sY = (vHeight - size) / 2;
        sWidth = size;
        sHeight = size;
        canvas.width = size;
        canvas.height = size;
      } else if (aspectRatio === '16:9') {
        canvas.width = 1920;
        canvas.height = 1080;
      } else {
        // 4:3 default
        canvas.width = 1600;
        canvas.height = 1200;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw photo frame
      if (facingMode === 'user') {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      }

      // Draw Watermark / Timestamp Stamp
      drawStampOnCanvas(ctx, canvas.width, canvas.height, location, settings);

      return canvas.toDataURL('image/jpeg', 0.95);
    },
    [isStreaming, facingMode, aspectRatio]
  );

  return {
    videoRef,
    isStreaming,
    cameraError,
    facingMode,
    switchCamera,
    hasTorch,
    torchOn,
    toggleTorch,
    aspectRatio,
    setAspectRatio,
    showGrid,
    setShowGrid,
    capturePhoto,
    restartCamera: startCamera,
  };
}

function drawStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  location: GPSLocation | null,
  settings: StampSettings
) {
  const scale = Math.max(width, height) / 1200;
  const now = new Date();

  // Formatting strings
  const dateStr =
    settings.dateFormat === 'iso'
      ? now.toISOString().replace('T', ' ').slice(0, 19)
      : now.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

  const lat = location?.latitude ?? 28.6139;
  const lng = location?.longitude ?? 77.2090;

  const latStr =
    settings.coordinatesFormat === 'dms'
      ? toDMS(lat, true)
      : `${lat.toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr =
    settings.coordinatesFormat === 'dms'
      ? toDMS(lng, false)
      : `${lng.toFixed(5)}° ${lng >= 0 ? 'E' : 'W'}`;

  const coordsText = `Lat: ${latStr} | Long: ${lngStr}`;
  const addressText = location?.address || 'Current GPS Location';
  const altitudeText = location?.altitude
    ? `Alt: ${Math.round(location.altitude)}m | Acc: ±${location.accuracy}m`
    : `Acc: ±${location?.accuracy ?? 5}m | Heading: ${location?.heading ?? 0}°`;

  // Determine Badge Dimensions
  const paddingX = 24 * scale;
  const paddingY = 18 * scale;
  const badgeWidth = Math.min(width * 0.94, 600 * scale);

  ctx.save();

  if (settings.style === 'minimal') {
    // Bottom minimal bar
    const barHeight = 44 * scale;
    ctx.fillStyle = `rgba(15, 23, 42, ${settings.stampBackgroundOpacity})`;
    ctx.fillRect(0, height - barHeight, width, barHeight);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${13 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('CAMMETA GPS', paddingX, height - barHeight + 26 * scale);

    ctx.fillStyle = '#ffffff';
    ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(
      `${coordsText} • ${dateStr}`,
      paddingX + 110 * scale,
      height - barHeight + 26 * scale
    );
  } else if (settings.style === 'survey') {
    // Field survey style with project tags
    const cardHeight = 175 * scale;
    const posX = paddingX;
    const posY = height - cardHeight - paddingX;

    // Card background
    ctx.fillStyle = `rgba(15, 23, 42, ${settings.stampBackgroundOpacity})`;
    roundRect(ctx, posX, posY, badgeWidth, cardHeight, 14 * scale);
    ctx.fill();

    // Top accent header
    ctx.fillStyle = '#f59e0b'; // Amber
    roundRect(ctx, posX, posY, badgeWidth, 34 * scale, [14 * scale, 14 * scale, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${14 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(
      `FIELD SURVEY: ${settings.projectName || 'CAMMETA AUDIT'}`,
      posX + 16 * scale,
      posY + 22 * scale
    );

    let curY = posY + 58 * scale;
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `bold ${13 * scale}px system-ui, sans-serif`;
    ctx.fillText(coordsText, posX + 16 * scale, curY);

    curY += 24 * scale;
    ctx.font = `${12 * scale}px system-ui, sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Time: ${dateStr}`, posX + 16 * scale, curY);

    curY += 22 * scale;
    ctx.fillText(`Loc: ${addressText.slice(0, 52)}`, posX + 16 * scale, curY);

    curY += 22 * scale;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(
      `${altitudeText} • ${settings.customNote || 'Verified Site Photo'}`,
      posX + 16 * scale,
      curY
    );
  } else if (settings.style === 'technical') {
    // Technical crosshairs & HUD
    const cardHeight = 150 * scale;
    const posX = width - badgeWidth - paddingX;
    const posY = height - cardHeight - paddingX;

    ctx.fillStyle = `rgba(2, 6, 23, ${settings.stampBackgroundOpacity})`;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, posX, posY, badgeWidth, cardHeight, 10 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${14 * scale}px monospace`;
    ctx.fillText('CAMMETA // METADATA HUD', posX + 16 * scale, posY + 28 * scale);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${12 * scale}px monospace`;
    ctx.fillText(`GEO : ${coordsText}`, posX + 16 * scale, posY + 56 * scale);
    ctx.fillText(`ALT : ${altitudeText}`, posX + 16 * scale, posY + 80 * scale);
    ctx.fillText(`UTC : ${now.toISOString()}`, posX + 16 * scale, posY + 104 * scale);
    ctx.fillText(`TAG : ${settings.customNote || 'AUTHENTICATED'}`, posX + 16 * scale, posY + 128 * scale);
  } else {
    // Default 'standard' stamp: elegant dark frosted card with cyan accent line
    const cardHeight = 145 * scale;
    let posX = paddingX;
    let posY = height - cardHeight - paddingX;

    if (settings.position === 'bottom-right') {
      posX = width - badgeWidth - paddingX;
    } else if (settings.position === 'top-left') {
      posY = paddingX + 50 * scale;
    } else if (settings.position === 'bottom-banner') {
      posX = 0;
      posY = height - cardHeight;
    }

    const actualWidth = settings.position === 'bottom-banner' ? width : badgeWidth;
    const radius = settings.position === 'bottom-banner' ? 0 : 16 * scale;

    ctx.fillStyle = `rgba(15, 23, 42, ${settings.stampBackgroundOpacity})`;
    roundRect(ctx, posX, posY, actualWidth, cardHeight, radius);
    ctx.fill();

    // Top cyan line
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(posX, posY, actualWidth, 4 * scale);

    // Title & Logo
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${15 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('CAMMETA GPS CAMERA', posX + 20 * scale, posY + 30 * scale);

    // Date & Time badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(dateStr, posX + 20 * scale, posY + 54 * scale);

    // Coordinates
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${13 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(coordsText, posX + 20 * scale, posY + 78 * scale);

    // Address
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`;
    const truncatedAddress = addressText.length > 55 ? addressText.slice(0, 52) + '...' : addressText;
    ctx.fillText(truncatedAddress, posX + 20 * scale, posY + 102 * scale);

    // Details: Accuracy / Custom Note
    ctx.fillStyle = '#38bdf8';
    ctx.font = `${11 * scale}px system-ui, -apple-system, sans-serif`;
    const note = settings.customNote ? ` • Note: ${settings.customNote}` : '';
    ctx.fillText(`${altitudeText}${note}`, posX + 20 * scale, posY + 124 * scale);
  }

  ctx.restore();
}

function toDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[]
) {
  let radii = [0, 0, 0, 0];
  if (typeof r === 'number') {
    radii = [r, r, r, r];
  } else if (Array.isArray(r)) {
    radii = r;
  }
  ctx.beginPath();
  ctx.moveTo(x + radii[0], y);
  ctx.lineTo(x + w - radii[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1]);
  ctx.lineTo(x + w, y + h - radii[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h);
  ctx.lineTo(x + radii[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3]);
  ctx.lineTo(x, y + radii[0]);
  ctx.quadraticCurveTo(x, y, x + radii[0], y);
  ctx.closePath();
}
