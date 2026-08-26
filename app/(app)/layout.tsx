import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-full bg-bg">
      <Sidebar />
      {children}
    </div>
  );
}
