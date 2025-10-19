import Link from "next/link";
import styles from "@/lib/styles/exhibitionCard.module.css";

interface ExhibitionCardProps {
  exhibition: {
    id: string;
    name: string;
    description?: string | null;
    thumbnail?: string | null;
  };
}

export default function ExhibitionCard({ exhibition }: ExhibitionCardProps) {
  return (
    <Link href={`/exhibitions/${exhibition.id}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        {exhibition.thumbnail ? (
          <img
            src={exhibition.thumbnail}
            alt={`${exhibition.name} thumbnail`}
            className={styles.thumbnail}
            loading="lazy"
          />
        ) : (
          <div className={styles.noThumbnail}>No image</div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{exhibition.name}</h3>
        <p className={styles.description}>
          {exhibition.description || "No description provided."}
        </p>
      </div>
    </Link>
  );
}
