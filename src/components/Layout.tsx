import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}