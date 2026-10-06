import styles from "./styles.module.css";

export function ChatEmpty() {
  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h2>Say hello to Ezer! 👋</h2>
        <p>Select text on this page to save a note or reminder.</p>
        <p>
          Type <kbd>/</kbd> below for more options.
        </p>
      </div>
    </div>
  );
}
