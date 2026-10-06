import { useEffect, useState } from "react";

import { watchActiveSiteScope } from "@src/sidepanel/utils/site-scope.ts";

export function useSiteScope(): string | null | undefined {
  const [siteScope, setSiteScope] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    return watchActiveSiteScope((site) => {
      setSiteScope(site);
    });
  }, []);

  return siteScope;
}
