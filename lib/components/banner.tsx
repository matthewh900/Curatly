import Link from "next/link";
import styles from "@/styles/banner.module.css"

export default function Banner() {
  return (
    <div className={styles.banner}>
      <Link href="/" className={styles.link}>
        Curatly
      </Link>
    </div>
  );
}
