import React from "react";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  separator?: string;
  onEnd?: () => void;
  enableScrollSpy?: boolean;
  scrollSpyOnce?: boolean;
}

export function AnimatedCounter({
  start = 0,
  end,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  separator = ",",
  onEnd,
  enableScrollSpy = false,
  scrollSpyOnce = true,
}: AnimatedCounterProps) {
  return (
    <CountUp
      start={start}
      end={end}
      duration={duration}
      delay={delay}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      separator={separator}
      onEnd={onEnd}
      enableScrollSpy={enableScrollSpy}
      scrollSpyOnce={scrollSpyOnce}
      className={cn("transition-all", className)}
    >
      {({ countUpRef, start }) => (
        <span ref={countUpRef} className="tabular-nums" onMouseEnter={start}>
          {start}
        </span>
      )}
    </CountUp>
  );
} 