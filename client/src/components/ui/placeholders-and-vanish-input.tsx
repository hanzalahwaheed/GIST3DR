"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PixelPoint {
  x: number;
  y: number;
  r: number;
  color: string;
}

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startAnimation = useCallback((): void => {
    if (placeholders.length === 0) {
      return;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  }, [placeholders.length]);

  const handleVisibilityChange = useCallback((): void => {
    if (document.visibilityState !== "visible" && intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  }, [startAnimation]);

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange, startAnimation]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const newDataRef = useRef<PixelPoint[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const draw = useCallback((): void => {
    if (!inputRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);

    const computedStyles = getComputedStyle(inputRef.current);
    const fontSize = Number.parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const nextPoints: PixelPoint[] = [];

    for (let row = 0; row < 800; row += 1) {
      const rowOffset = 4 * row * 800;
      for (let col = 0; col < 800; col += 1) {
        const index = rowOffset + 4 * col;
        if (pixelData[index] !== 0 && pixelData[index + 1] !== 0 && pixelData[index + 2] !== 0) {
          nextPoints.push({
            x: col,
            y: row,
            r: 1,
            color: `rgba(${pixelData[index]}, ${pixelData[index + 1]}, ${pixelData[index + 2]}, ${pixelData[index + 3]})`,
          });
        }
      }
    }

    newDataRef.current = nextPoints;
  }, [value]);

  useEffect(() => {
    draw();
  }, [draw, value]);

  function animate(start: number): void {
    const animateFrame = (position = 0): void => {
      window.requestAnimationFrame(() => {
        const next: PixelPoint[] = [];

        for (const current of newDataRef.current) {
          if (current.x < position) {
            next.push(current);
            continue;
          }

          if (current.r <= 0) {
            continue;
          }

          current.x += Math.random() > 0.5 ? 1 : -1;
          current.y += Math.random() > 0.5 ? 1 : -1;
          current.r -= 0.05 * Math.random();
          next.push(current);
        }

        newDataRef.current = next;

        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(position, 0, 800, 800);
          for (const point of newDataRef.current) {
            if (point.x <= position) {
              continue;
            }

            ctx.beginPath();
            ctx.rect(point.x, point.y, point.r, point.r);
            ctx.fillStyle = point.color;
            ctx.strokeStyle = point.color;
            ctx.stroke();
          }
        }

        if (newDataRef.current.length > 0) {
          animateFrame(position - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };

    animateFrame(start);
  }

  function vanishAndSubmit(): void {
    setAnimating(true);
    draw();

    const currentValue = inputRef.current?.value ?? "";
    if (!currentValue || !inputRef.current) {
      setAnimating(false);
      return;
    }

    const maxX = newDataRef.current.reduce((prev, current) => (current.x > prev ? current.x : prev), 0);
    animate(maxX);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    vanishAndSubmit();
    onSubmit?.(event);
  }

  const placeholderText = placeholders[currentPlaceholder] ?? "";

  return (
    <form
      className={cn(
        "relative mx-auto h-12 w-full max-w-xl overflow-hidden rounded-full bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200 dark:bg-zinc-800",
        value && "bg-gray-50",
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        className={cn(
          "pointer-events-none absolute left-2 top-[20%] origin-top-left scale-50 transform pr-20 text-base invert filter dark:invert-0 sm:left-8",
          !animating ? "opacity-0" : "opacity-100",
        )}
        ref={canvasRef}
      />

      <input
        onChange={(event) => {
          if (!animating) {
            setValue(event.target.value);
            onChange?.(event);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "relative z-50 h-full w-full rounded-full border-none bg-transparent pl-4 pr-20 text-sm text-black focus:outline-none focus:ring-0 dark:text-white sm:pl-10 sm:text-base",
          animating && "text-transparent dark:text-transparent",
        )}
      />

      <button
        disabled={!value}
        type="submit"
        className="absolute right-2 top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black transition duration-200 disabled:bg-gray-100 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-gray-300"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{ strokeDasharray: "50%", strokeDashoffset: "50%" }}
            animate={{ strokeDashoffset: value ? 0 : "50%" }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      <div className="pointer-events-none absolute inset-0 flex items-center rounded-full">
        <AnimatePresence mode="wait">
          {!value ? (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="w-[calc(100%-2rem)] truncate pl-4 text-left text-sm font-normal text-neutral-500 dark:text-zinc-500 sm:pl-12 sm:text-base"
            >
              {placeholderText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
