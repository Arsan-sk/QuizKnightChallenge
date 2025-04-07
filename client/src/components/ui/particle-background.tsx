import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

interface ParticleBackgroundProps {
  className?: string;
  variant?: "default" | "celebration" | "subtle";
}

export function ParticleBackground({ 
  className, 
  variant = "default"
}: ParticleBackgroundProps) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const getOptions = () => {
    const baseOptions = {
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.3,
            },
          },
        },
      },
      particles: {
        color: {
          value: "#6366f1", // indigo-500
        },
        links: {
          color: "#6366f1",
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 50,
        },
        opacity: {
          value: 0.3,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    };

    if (variant === "celebration") {
      return {
        ...baseOptions,
        particles: {
          ...baseOptions.particles,
          color: {
            value: ["#FFD700", "#FF4500", "#00BFFF", "#7CFC00", "#FF1493"],
          },
          move: {
            ...baseOptions.particles.move,
            speed: 3,
          },
          number: {
            ...baseOptions.particles.number,
            value: 80,
          },
          opacity: {
            value: 0.6,
          },
        },
      };
    }

    if (variant === "subtle") {
      return {
        ...baseOptions,
        particles: {
          ...baseOptions.particles,
          number: {
            ...baseOptions.particles.number,
            value: 20,
          },
          opacity: {
            value: 0.1,
          },
          move: {
            ...baseOptions.particles.move,
            speed: 0.5,
          },
        },
        interactivity: {
          ...baseOptions.interactivity,
          events: {
            ...baseOptions.interactivity.events,
            onHover: {
              enable: true,
              mode: "connect",
            },
          },
        },
      };
    }

    return baseOptions;
  };

  return (
    <Particles
      id="tsparticles"
      className={`fixed inset-0 -z-10 h-full w-full ${className || ''}`}
      init={particlesInit}
      options={getOptions()}
    />
  );
} 