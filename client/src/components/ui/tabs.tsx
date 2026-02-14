"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  title: string;
  value: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}

export function Tabs({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: TabsProps) {
  const [tabs, setTabs] = useState<TabItem[]>(propTabs);
  const [active, setActive] = useState<TabItem | null>(propTabs[0] ?? null);
  const [hovering, setHovering] = useState(false);

  if (propTabs.length === 0 || active === null) {
    return null;
  }

  function moveSelectedTabToTop(index: number): void {
    const newTabs = [...propTabs];
    const [selectedTab] = newTabs.splice(index, 1);
    if (!selectedTab) {
      return;
    }
    newTabs.unshift(selectedTab);
    setTabs(newTabs);
    setActive(newTabs[0]);
  }

  return (
    <>
      <div
        className={cn(
          "no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-start overflow-auto text-[#ddffdc] [perspective:1000px] sm:overflow-visible",
          containerClassName,
        )}
      >
        {propTabs.map((tab, index) => (
          <button
            key={tab.title}
            onClick={() => moveSelectedTabToTop(index)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn("relative rounded-full px-4 py-2", tabClassName)}
            style={{ transformStyle: "preserve-3d" }}
          >
            {active.value === tab.value ? (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-br from-green-500 to-green-700 font-bold text-white",
                  activeTabClassName,
                )}
              />
            ) : null}

            <span className="relative block text-[#ddffdc]">{tab.title}</span>
          </button>
        ))}
      </div>
      <FadeInDiv tabs={tabs} active={active} hovering={hovering} className={cn("mt-12", contentClassName)} />
    </>
  );
}

interface FadeInDivProps {
  className?: string;
  tabs: TabItem[];
  active: TabItem;
  hovering: boolean;
}

export function FadeInDiv({ className, tabs, active, hovering }: FadeInDivProps) {
  return (
    <div className="relative h-full w-full">
      {tabs.map((tab, index) => (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          style={{
            scale: 1 - index * 0.1,
            top: hovering ? index * -50 : 0,
            zIndex: -index,
            opacity: index < 3 ? 1 - index * 0.1 : 0,
          }}
          animate={{ y: tab.value === active.value ? [0, 40, 0] : 0 }}
          className={cn("absolute left-0 top-0 h-full w-full", className)}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
}
