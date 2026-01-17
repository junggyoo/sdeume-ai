"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  shimmerOffset: number;
  shimmerSpeed: number;
  vx: number;
  vy: number;
}

interface PearlDustCanvasProps {
  /** Number of particles (default: 50) */
  particleCount?: number;
  /** Mouse repel radius in pixels (default: 150) */
  mouseRadius?: number;
  /** Particle color (default: rgba(255, 180, 200, 0.6)) */
  particleColor?: string;
  /** Additional className */
  className?: string;
}

/**
 * Canvas-based Pearl Dust Particle System
 *
 * 진주빛 파티클들이 화면에 떠다니며 마우스에 반응합니다.
 * Shimmer 효과로 반짝이는 느낌을 줍니다.
 */
export function PearlDustCanvas({
  particleCount = 50,
  mouseRadius = 150,
  particleColor = "rgba(255, 180, 200, 0.6)",
  className = "",
}: PearlDustCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Initialize particles
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        shimmerOffset: Math.random() * Math.PI * 2,
        shimmerSpeed: Math.random() * 0.02 + 0.01,
        vx: 0,
        vy: 0,
      });
    }
    particlesRef.current = particles;
  }, [particleCount]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    timeRef.current += 0.016; // ~60fps time increment

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    particlesRef.current.forEach((particle) => {
      // Mouse repulsion
      const dx = mouseRef.current.x - particle.x;
      const dy = mouseRef.current.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseRadius && distance > 0) {
        const force = (mouseRadius - distance) / mouseRadius;
        const angle = Math.atan2(dy, dx);
        particle.vx -= Math.cos(angle) * force * 2;
        particle.vy -= Math.sin(angle) * force * 2;
      }

      // Apply velocity and friction
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.95;
      particle.vy *= 0.95;

      // Return to base position
      const returnForce = 0.01;
      particle.x += (particle.baseX - particle.x) * returnForce;
      particle.y += (particle.baseY - particle.y) * returnForce;

      // Shimmer effect (sin wave opacity)
      const shimmer = Math.sin(timeRef.current * 2 + particle.shimmerOffset) * 0.3 + 0.7;
      const currentOpacity = particle.opacity * shimmer;

      // Draw particle with pink glow shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particleColor.replace(/[\d.]+\)$/, `${currentOpacity})`);
      ctx.shadowColor = "rgba(255, 150, 180, 0.5)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [mouseRadius, particleColor]);

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    initParticles(rect.width, rect.height);
  }, [initParticles]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [handleResize, handleMouseMove, handleMouseLeave, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-20 ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
