"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraState {
  ready: boolean;
  error: string | null;
  starting: boolean;
}

export function useCamera({ enabled }: { enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingRef = useRef<"environment" | "user">("environment");
  const sessionRef = useRef(0);
  const [state, setState] = useState<CameraState>({
    ready: false,
    error: null,
    starting: false,
  });
  const [facingMode, setFacingModeState] = useState<"environment" | "user">(
    "environment",
  );

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    teardown();
    setState((prev) => ({ ...prev, ready: false, starting: false }));
  }, [teardown]);

  const start = useCallback(async () => {
    sessionRef.current += 1;
    const session = sessionRef.current;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({
        ready: false,
        starting: false,
        error: "This browser does not expose a camera API. Upload a file instead.",
      });
      return;
    }

    teardown();
    setState({ ready: false, starting: true, error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingRef.current },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState({ ready: true, starting: false, error: null });
    } catch (error) {
      if (session !== sessionRef.current) return;
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera permission was denied. Allow access or upload a file instead."
          : error instanceof DOMException && error.name === "NotFoundError"
            ? "No camera was found on this device. Upload a file instead."
            : "Unable to start the camera. Upload a file instead.";
      setState({ ready: false, starting: false, error: message });
    }
  }, [teardown]);

  useEffect(() => {
    if (!enabled) {
      sessionRef.current += 1;
      teardown();
      setState({ ready: false, starting: false, error: null });
      return;
    }
    void start();
    return () => {
      sessionRef.current += 1;
      teardown();
    };
  }, [enabled, facingMode, start, teardown]);

  const flip = useCallback(() => {
    facingRef.current = facingRef.current === "environment" ? "user" : "environment";
    setFacingModeState(facingRef.current);
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const stamp = new Date();
    const fontSize = Math.max(14, Math.round(canvas.width * 0.018));
    const pad = Math.round(canvas.width * 0.02);
    const label = `PROOFDROP LIVE ${stamp.toISOString()}`;
    context.font = `600 ${fontSize}px ui-monospace, monospace`;
    const metrics = context.measureText(label);
    context.fillStyle = "rgba(3, 7, 14, 0.72)";
    context.fillRect(
      pad / 2,
      canvas.height - pad * 2.6,
      metrics.width + pad * 1.4,
      pad * 1.7,
    );
    context.fillStyle = "#6ee7b7";
    context.fillText(label, pad, canvas.height - pad * 1.4);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Capture failed."))),
        "image/jpeg",
        0.92,
      );
    });
  }, []);

  return {
    videoRef,
    ...state,
    facingMode,
    start,
    stop,
    flip,
    capture,
  };
}
