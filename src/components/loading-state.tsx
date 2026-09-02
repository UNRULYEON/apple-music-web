import { Spinner } from "@/components/ui/spinner";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center grow">
      <Spinner className="size-6" />
    </div>
  );
}
