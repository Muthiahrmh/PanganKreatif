"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export function CountUp({
  value,
  suffix = "",
  duration = 1.8,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplay(
        latest.toLocaleString("id-ID", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    });
  }, [springValue, decimals]);

  return (
    <span ref={ref} className="font-data tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
