"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Video,
  Mic,
  MicOff,
  Play,
  Square,
  Pause,
  RotateCcw,
  Download,
  Check,
  Sliders,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react";
import {
  formatRecordingTime,
  formatFileSize,
  getOptimalMimeType,
  RESOLUTION_PRESETS,
} from "./engine";

type RecordStatus = "idle" | "recording" | "paused" | "finished";

export default function ScreenRecorder() {
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [includeMic, setIncludeMic] = useState(true);
  const [resolution, setResolution] = useState<"1080p" | "720p">("1080p");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick
  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [videoUrl]);

  const startRecording = async () => {
    setErrorMsg(null);
    chunksRef.current = [];
    setSecondsElapsed(0);

    try {
      const preset = RESOLUTION_PRESETS[resolution];
      // 1. Get Screen Display Media
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: 30 },
        },
        audio: true, // Screen audio if selected
      });

      let finalStream = screenStream;

      // 2. Mix with Mic Audio if enabled
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });

          // Combine tracks
          const tracks = [...screenStream.getVideoTracks(), ...micStream.getAudioTracks()];
          // If screen also has audio, include it too
          screenStream.getAudioTracks().forEach((track) => tracks.push(track));
          finalStream = new MediaStream(tracks);
        } catch (micErr) {
          console.warn("Could not capture microphone, recording screen only", micErr);
        }
      }

      streamRef.current = finalStream;

      // Handle user stopping screen share from native browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      const mimeType = getOptimalMimeType();
      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: preset.videoBitsPerSecond,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setVideoUrl(url);
        setStatus("finished");

        // Stop all tracks
        finalStream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1-second chunks for safety
      setStatus("recording");
    } catch (err: unknown) {
      console.error("Recording error", err);
      if (err instanceof Error && err.name !== "NotAllowedError") {
        setErrorMsg(err.message || "Could not start screen recording");
      }
      setStatus("idle");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === "recording" || status === "paused")) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setRecordedBlob(null);
    setSecondsElapsed(0);
    setStatus("idle");
  };

  const handleDownload = () => {
    if (!videoUrl || !recordedBlob) return;
    const isMp4 = recordedBlob.type.includes("mp4");
    const ext = isMp4 ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `recording-${Date.now()}.${ext}`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Browser Screen & Webcam Recorder
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Capture HD screen recordings and voiceovers directly in browser with unlimited duration and zero watermarks.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
          <AlertCircle size={14} className="text-zinc-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          <label className="font-medium text-zinc-900 dark:text-zinc-200 block">
            Recording Configuration
          </label>

          {/* Resolution Selector */}
          <div>
            <label className="text-zinc-500 block mb-1.5">Output Quality</label>
            <div className="grid grid-cols-2 gap-2">
              {(["1080p", "720p"] as const).map((r) => (
                <button
                  key={r}
                  disabled={status !== "idle"}
                  onClick={() => setResolution(r)}
                  className={`py-1.5 rounded-lg border text-center transition font-mono ${
                    resolution === r
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {r} HD
                </button>
              ))}
            </div>
          </div>

          {/* Microphone Audio Toggle */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              disabled={status !== "idle"}
              onClick={() => setIncludeMic((prev) => !prev)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition ${
                includeMic
                  ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent"
                  : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {includeMic ? <Mic size={14} /> : <MicOff size={14} />}
                <span className="font-medium">Microphone Narration</span>
              </div>
              <span className="text-[11px] font-mono">{includeMic ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1 leading-relaxed">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">100% Client-Side Privacy:</p>
            <p>
              Video frames are encoded strictly inside your browser memory using native hardware acceleration. Nothing is transmitted to any cloud server.
            </p>
          </div>
        </div>

        {/* Recording Screen / Preview Column */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[380px] bg-zinc-950 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          {status === "idle" && (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-inner">
                <Video size={28} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Ready to Record</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Click the button below to pick your screen, specific application window, or browser tab.
                </p>
              </div>
              <button
                onClick={startRecording}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition shadow-sm"
              >
                <Play size={14} />
                Start Screen Capture
              </button>
            </div>
          )}

          {(status === "recording" || status === "paused") && (
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Pulsing indicator */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-xl">
                <span
                  className={`w-3 h-3 rounded-full ${
                    status === "recording" ? "bg-zinc-100 animate-pulse" : "bg-zinc-500"
                  }`}
                />
                <span className="font-mono text-lg font-bold text-zinc-100 tracking-wider">
                  {formatRecordingTime(secondsElapsed)}
                </span>
                <span className="text-xs text-zinc-400 capitalize font-medium">({status})</span>
              </div>

              <div className="flex items-center gap-3">
                {status === "recording" ? (
                  <button
                    onClick={pauseRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  >
                    <Pause size={14} />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  >
                    <Play size={14} />
                    Resume
                  </button>
                )}

                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition shadow"
                >
                  <Square size={14} />
                  Stop & Review
                </button>
              </div>
            </div>
          )}

          {status === "finished" && videoUrl && recordedBlob && (
            <div className="w-full flex flex-col items-center gap-4">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full max-h-[360px] rounded-lg border border-zinc-800 bg-black shadow-lg"
              />

              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-2">
                <div className="flex items-center gap-4 text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {formatRecordingTime(secondsElapsed)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HardDrive size={13} />
                    {formatFileSize(recordedBlob.size)}
                  </span>
                  <span>{resolution} HD</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition"
                  >
                    <RotateCcw size={13} />
                    Record New
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition shadow-sm"
                  >
                    <Download size={13} />
                    Download Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
