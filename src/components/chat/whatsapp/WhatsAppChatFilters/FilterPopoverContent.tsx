
import { FilterMainMenu } from "./FilterMainMenu";
import { FilterTagsSubmenu } from "./FilterTagsSubmenu";
import { FilterFunnelSubmenu } from "./FilterFunnelSubmenu";

interface FilterPopoverContentProps {
  activeSubmenu: string | null;
  activeFilter: string;
  onMainFilterClick: (filterKey: string, hasSubmenu: boolean) => void;
  onSubmenuItemClick: (value: string) => void;
  onBackToMain: () => void;
}

export const FilterPopoverContent = ({
  activeSubmenu,
  activeFilter,
  onMainFilterClick,
  onSubmenuItemClick,
  onBackToMain
}: FilterPopoverContentProps) => {
  if (activeSubmenu === null) {
    return (
      <FilterMainMenu 
        activeFilter={activeFilter}
        onFilterClick={onMainFilterClick}
      />
    );
  }

  if (activeSubmenu === "tags") {
    return (
      <FilterTagsSubmenu 
        onBack={onBackToMain}
        onItemClick={onSubmenuItemClick}
      />
    );
  }

  if (activeSubmenu === "funnel") {
    return (
      <FilterFunnelSubmenu 
        onBack={onBackToMain}
        onItemClick={onSubmenuItemClick}
      />
    );
  }

  return null;
};
