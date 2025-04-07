import React, { useCallback, useEffect, useState } from "react";
import { useWindowSize } from "react-use";
import { loadSlim } from "tsparticles-slim";
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";

interface ConfettiOverlayProps {
  active: boolean;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export function ConfettiOverlay({
  active,
  duration = 3000,
  className,
  onComplete,
}: ConfettiOverlayProps) {
  const [isActive, setIsActive] = useState(false);
  const { width, height } = useWindowSize();

  // Initialize particles
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Handle showing and hiding confetti with duration
  useEffect(() => {
    if (active && !isActive) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <Particles
      id="confetti-overlay"
      className={`fixed inset-0 z-50 pointer-events-none ${className || ""}`}
      init={particlesInit}
      options={{
        particles: {
          number: {
            value: 100,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: [
              "#FF577F", // Pink
              "#FF884B", // Orange
              "#FFD384", // Yellow
              "#FFF9B0", // Light Yellow
              "#A7D2CB", // Teal
              "#9AD0EC", // Blue
              "#ECC5FB", // Purple
            ],
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: 0.8,
            random: true,
          },
          size: {
            value: 8,
            random: true,
          },
          move: {
            enable: true,
            speed: 7,
            direction: "bottom",
            random: true,
            straight: false,
            outModes: "out",
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        detectRetina: true,
      }}
      width={width}
      height={height}
    />
  );
} 