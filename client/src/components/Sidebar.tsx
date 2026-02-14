"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  return (
    <div className="card z-50 mb-4 mt-4 flex h-fit flex-col items-center justify-between gap-12 rounded-2xl p-4">
      <Link href="/">
        <div>
          <h1 className="text-xl font-bold">GIST</h1>
          <h1 className="text-xl font-bold">3DR</h1>
        </div>
      </Link>

      <ul className="flex flex-col gap-6">
        <li>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <button className="flex gap-2 rounded-xl p-3 text-sm text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#7fee64]/20 hover:text-[#7fee64]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="icon icon-tabler icon-tabler-home"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z" />
                    </svg>
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="card" side="right">
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>

        <li>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/add-patient">
                  <button className="flex gap-2 rounded-xl p-3 text-sm text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#7fee64]/20 hover:text-[#7fee64]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon icon-tabler icon-tabler-user-plus"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                      <path d="M16 19h6" />
                      <path d="M19 16v6" />
                      <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
                    </svg>
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="card" side="right">
                <p>Add Patient</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>
      </ul>
    </div>
  );
}
