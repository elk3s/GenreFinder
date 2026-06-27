import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  height?: number;
  barColor?: string;
}

export default function AudioVisualizer({
  isPlaying,
  analyser,
  height = 40,
  barColor = "bg-zinc-900"
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    if (!isPlaying) {
      // Draw static flat line / minimal dots when silent
      ctx.clearRect(0, 0, canvas.clientWidth, height);
      ctx.beginPath();
      ctx.strokeStyle = "#e4e4e7"; // zinc-200
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(canvas.clientWidth, height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;
      const width = canvas.clientWidth;
      
      ctx.clearRect(0, 0, width, height);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback simulated waves if analyser is not yet initialized
        const time = Date.now() * 0.005;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(i * 0.3 + time) * 40 + 50;
        }
      }

      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Scale frequency data to fit height
        barHeight = (dataArray[i] / 255) * height * 0.85;
        if (barHeight < 2) barHeight = 2; // minimum height

        ctx.fillStyle = "#18181b"; // zinc-900
        
        // Draw centered capsule bars
        const y = (height - barHeight) / 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth - 1.5, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth - 1.5, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser, height, barColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg bg-zinc-50 border border-zinc-100"
      style={{ height: `${height}px` }}
    />
  );
}
