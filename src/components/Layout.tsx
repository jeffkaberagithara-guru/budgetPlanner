import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-56 ml-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Bottom nav — visible on mobile only */}
      <BottomNav />
    </div>
  );
}