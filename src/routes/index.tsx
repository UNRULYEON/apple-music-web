import { SidebarToggle } from "@/components";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-2">
      <div className="flex gap-0.5">
        <SidebarToggle />
      </div>
    </div>
  );
}
