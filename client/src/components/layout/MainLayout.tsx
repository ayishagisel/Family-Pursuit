import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default MainLayout;
