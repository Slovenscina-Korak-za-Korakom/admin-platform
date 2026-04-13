"use client";

import React, {createContext, useCallback, useContext, useEffect, useRef, useState,} from "react";
import {cn} from "@/lib/utils";

// ── Context ────────────────────────────────────────────────────────────────

interface ContextValue {
  value: string;
  onChange: (value: string) => void;
  pillRect: { left: number; width: number; height: number };
  activeHex: string;
  activeLightColor: string;
  registerItem: (
    itemValue: string,
    el: HTMLButtonElement | null,
    hex: string,
    lightColor: string
  ) => void;
}

const Context = createContext<ContextValue | null>(null);

function useCtx() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("AnimatedButtonGroup.Item must be used inside AnimatedButtonGroup");
  return ctx;
}

// ── Root ───────────────────────────────────────────────────────────────────

interface AnimatedButtonGroupProps {
  value: string;
  showDot?: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function AnimatedButtonGroupRoot({
                                   value,
                                   showDot = false,
                                   onChange,
                                   children,
                                   className,
                                 }: AnimatedButtonGroupProps) {
  const refsMap = useRef<Map<string, HTMLButtonElement>>(new Map());
  const colorsMap = useRef<Map<string, { hex: string; lightColor: string }>>(new Map());

  const [pillRect, setPillRect] = useState({left: 0, width: 0, height: 0});
  const [activeHex, setActiveHex] = useState("#000");
  const [activeLightColor, setActiveLightColor] = useState("transparent");

  const registerItem = useCallback(
    (itemValue: string, el: HTMLButtonElement | null, hex: string, lightColor: string) => {
      colorsMap.current.set(itemValue, {hex, lightColor});
      if (el) refsMap.current.set(itemValue, el);
      else refsMap.current.delete(itemValue);
    },
    []
  );

  useEffect(() => {
    const btn = refsMap.current.get(value);
    const colors = colorsMap.current.get(value);
    if (btn) setPillRect({left: btn.offsetLeft, width: btn.offsetWidth, height: btn.offsetHeight});
    if (colors) {
      setActiveHex(colors.hex);
      setActiveLightColor(colors.lightColor);
    }
  }, [value]);

  return (
    <Context.Provider value={{value, onChange, pillRect, activeHex, activeLightColor, registerItem}}>
      <div
        className={cn("relative grid", className)}
        style={{gridAutoFlow: "column", gridAutoColumns: "1fr", gap: "0.5rem"}}
      >
        {/* Sliding pill */}
        <div
          className="absolute top-0 rounded-xl pointer-events-none"
          style={{
            left: pillRect.left,
            width: pillRect.width,
            height: pillRect.height || "100%",
            backgroundColor: activeLightColor,
            border: `1.5px solid ${activeHex}`,
            transition:
              "left 420ms cubic-bezier(0.34,1.2,0.64,1), background-color 220ms ease, border-color 220ms ease",
            zIndex: 0,
          }}
        >
          {showDot && (
            <div
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
              style={{backgroundColor: activeHex, transition: "background-color 220ms ease"}}
            />
          )}
        </div>

        {children}
      </div>
    </Context.Provider>
  );
}

// ── Item ───────────────────────────────────────────────────────────────────

interface AnimatedButtonGroupItemProps {
  value: string;
  hex: string;
  lightColor: string;
  children: React.ReactNode;
  className?: string;
}

function AnimatedButtonGroupItem({
                                   value,
                                   hex,
                                   lightColor,
                                   children,
                                   className,
                                 }: AnimatedButtonGroupItemProps) {
  const ctx = useCtx();
  const localRef = useRef<HTMLButtonElement | null>(null);

  const refCallback = useCallback(
    (el: HTMLButtonElement | null) => {
      localRef.current = el;
      ctx.registerItem(value, el, hex, lightColor);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, hex, lightColor]
  );

  const btn = localRef.current;
  const btnLeft = btn?.offsetLeft ?? 0;
  const btnWidth = btn?.offsetWidth ?? 0;
  const {pillRect} = ctx;
  const clipLeft = Math.max(0, pillRect.left - btnLeft);
  const clipRight = Math.max(
    0,
    btnWidth - Math.min(btnWidth, pillRect.left + pillRect.width - btnLeft)
  );

  return (
    <button
      ref={refCallback}
      type="button"
      onClick={() => ctx.onChange(value)}
      className={cn("cursor-pointer relative rounded-xl px-3 py-3 text-[13px]", className)}
      style={{zIndex: 1}}
    >
      {/* Invisible spacer — sets the button's intrinsic size */}
      <span className="flex items-center justify-center gap-2 font-semibold opacity-0 select-none pointer-events-none" aria-hidden>
        {children}
      </span>
      {/* Base layer — muted, same position as overlay */}
      <span className="absolute inset-0 flex items-center justify-center gap-2 font-semibold text-muted-foreground select-none">
        {children}
      </span>
      {/* Colored overlay — clipped to the pill region */}
      <span
        className="absolute inset-0 flex items-center justify-center gap-2 font-semibold select-none pointer-events-none"
        style={{
          color: hex,
          clipPath: `inset(0 ${clipRight}px 0 ${clipLeft}px round 10px)`,
          transition: "clip-path 420ms cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {children}
      </span>
    </button>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────

export {
  AnimatedButtonGroupRoot as AnimatedButtonGroup,
  AnimatedButtonGroupItem,
};
