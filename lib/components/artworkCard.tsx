"use client";

import React from "react";
import { UnifiedArtwork } from "../types/unifiedArtwork";
import FavouriteButton from "@/lib/components/favouriteButton";
import styles from "@/lib/styles/favouritesPage.module.css"

interface ArtworkCardProps {
  artwork: UnifiedArtwork;
  userId?: string | null;
  children?: React.ReactNode;
}

export default function ArtworkCard({
  artwork,
  userId,
  children,
}: ArtworkCardProps) {
  return (
    <article className={styles.artCard}>
      {artwork.imageUrl ? (
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className={styles.artImage}
          loading="lazy"
        />
      ) : (
        <div className={styles.imagePlaceholder}>No Image</div>
      )}

      <h3 className={styles.artTitle}>{artwork.title}</h3>
      <p className={styles.artArtist}>{artwork.artist || "Unknown Artist"}</p>

      {artwork.date && <p className={styles.artDate}>{artwork.date}</p>}

      {artwork.artworkUrl && (
        <a
          href={artwork.artworkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          View on {artwork.provider === "met" ? "The Met" : "AIC"}
        </a>
      )}

      {userId && <FavouriteButton artwork={artwork} userId={userId} />}

      {children}
    </article>
  );
}

// Styles
const artCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 4,
  padding: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const artImageStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  objectFit: "cover",
  borderRadius: 4,
};

const imagePlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  backgroundColor: "#eee",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
};

const artTitleStyle: React.CSSProperties = {
  fontSize: 16,
  margin: "10px 0 4px",
};

const artArtistStyle: React.CSSProperties = {
  fontSize: 14,
  margin: "0 0 4px",
  color: "#555",
};

const artDateStyle: React.CSSProperties = {
  fontSize: 12,
  margin: 0,
  color: "#777",
};

const linkStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#0070f3",
  textDecoration: "none",
};
