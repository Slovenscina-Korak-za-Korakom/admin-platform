import React, { Suspense } from "react";
import LangDataTable from "./_components/lang-data-table";
import { IconLanguage, IconLoader2 } from "@tabler/icons-react";

const LanguageClubAdmin = () => {
  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shrink-0">
            <IconLanguage className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Language Club
            </h1>
            <p className="text-blue-100 text-sm mt-0.5">
              Manage events, bookings, and participants
            </p>
          </div>
        </div>
      </div>

      {/* Events Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Club Events
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View and manage all language club events
          </p>
        </div>
        <div className="p-6">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <IconLoader2 className="h-7 w-7 animate-spin text-blue-500" />
              </div>
            }
          >
            <LangDataTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LanguageClubAdmin;
