import { Spinner } from "@/components/ui/spinner";

export function LoadingState() {
  return (
    <div className="flex grow flex-col items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
