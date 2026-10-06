import styles from "./styles.module.css";

export function Loader() {
  return (
    <span className={styles.root} aria-hidden="true">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
