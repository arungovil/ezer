import { Button } from "@src/ui/components/common/button/index.tsx";
import { SlidersHorizontalIcon, ZapIcon } from "@src/ui/icons/index.ts";

import styles from "./styles.module.css";

export function ChatHeader() {
  return (
    <header className={styles.root}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <ZapIcon />
        </div>
        <h1>Ezer</h1>
      </div>
      <div className={styles.right}>
        <Button variant="ghost" size="icon-md" aria-label="Settings">
          <SlidersHorizontalIcon />
        </Button>
      </div>
    </header>
  );
}
