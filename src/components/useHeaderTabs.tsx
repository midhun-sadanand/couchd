import { useState } from "react";

export type Tab = { label: string; id: string; onClick: () => void };

export function useHeaderTabs(tabs: Tab[]) {
  const [[selectedTabIndex, direction], setSelectedTab] = useState([-1, 0]);
  
  return {
    tabProps: {
      tabs,
      selectedTabIndex,
      setSelectedTab,
    },
  };
} 