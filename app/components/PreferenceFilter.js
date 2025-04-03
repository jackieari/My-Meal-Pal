
"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PreferenceFilter() {
    const [open, setOpen] = useState(true);

    return (
        <div className="p-4 border rounded-md">
            <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full">
                <span className="font-semibold">Dietary Preferences</span>
                <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="mt-2">
                    {/* Add your filter options here */}
                    <p>Filter options go here.</p>
                </div>
            )}
        </div>
    );
}
