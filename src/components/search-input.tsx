import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useSearch, useView } from "@/hooks";
import { canSearch, searchLabel } from "@/lib/views/view";

export function SearchInput() {
  const { view } = useView();
  const { term, setTerm } = useSearch();

  if (!canSearch(view)) {
    return null;
  }

  const label = searchLabel(view);

  return (
    <InputGroup className="ms-auto w-64">
      <InputGroupAddon className="size-5">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        size="sm"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={label}
        aria-label={label}
      />
      {term !== "" && (
        <InputGroupAddon align="inline-end" className="">
          <button
            type="button"
            aria-label="Clear the search"
            onClick={() => setTerm("")}
            className="mr-2 flex cursor-pointer rounded-sm text-muted-foreground transition-colors duration-(--duration-quick) ease-(--ease-smooth-out) outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
