"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Mail, Lock, UserCog } from "lucide-react";

const sections = [
  { id: "account", label: "Account", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "password", label: "Password", icon: Lock },
  { id: "tutor-profile", label: "Tutor Profile", icon: UserCog },
];

export function SettingsNav({ activeSection }: { activeSection: string }) {
  const router = useRouter();

  return (
    <nav className="w-44 shrink-0">
      <ul className="space-y-0.5">
        {sections.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => router.push(`?section=${id}`)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left cursor-pointer",
                activeSection === id
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon size={14} className="shrink-0" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
