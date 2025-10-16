import Link from "next/link";

export default function Banner() {
  return (
    <div style={styles.banner}>
      <Link href="/" style={styles.link}>
        Curatly
      </Link>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    backgroundColor: "#0070f3",
    color: "white",
    padding: "0.75rem 1rem",
    fontWeight: "bold",
    fontSize: "1.25rem",
    textAlign: "center",
    cursor: "pointer",
    zIndex: 9999,
  },
  link: {
    color: "inherit",
    textDecoration: "none",
  },
};
