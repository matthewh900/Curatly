// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import Link from "next/link";
// import styles from "@/styles/publicExhibition.module.css";
// import ExhibitionCard from "@/lib/components/exhibitionCard";

// interface ExhibitionWithThumbnail {
//   id: string;
//   user_id: string;
//   name: string;
//   description: string | null;
//   thumbnail?: string | null;
// }

// export default function PublicExhibitions() {
//   const [exhibitions, setExhibitions] = useState<ExhibitionWithThumbnail[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchExhibitions = async () => {
//       setLoading(true);

//       const { data, error } = await supabase
//         .from("exhibitions")
//         .select(`
//           id,
//           user_id,
//           name,
//           description,
//           exhibition_favourites (
//             position,
//             favourite: favourites!inner (
//               id,
//               title,
//               image_url
//             )
//           )
//         `)
//         .order("created_at", { ascending: false });

//       if (error) {
//         setErrorMsg("Failed to load exhibitions.");
//         console.error(error);
//       } else if (data) {
//         const exWithThumbs: ExhibitionWithThumbnail[] = data.map((ex: any) => {
//           const sortedFavs = (ex.exhibition_favourites || []).sort(
//             (a: any, b: any) => a.position - b.position
//           );
//           const firstFav = sortedFavs[0]?.favourite;
//           return {
//             id: ex.id,
//             user_id: ex.user_id,
//             name: ex.name,
//             description: ex.description,
//             thumbnail: firstFav?.image_url || null,
//           };
//         });
//         setExhibitions(exWithThumbs);
//       }

//       setLoading(false);
//     };

//     fetchExhibitions();
//   }, []);

//   if (loading) {
//     return <p className={styles.main}>Loading exhibitions...</p>;
//   }

//   if (errorMsg) {
//     return <p className={styles.main} style={{ color: "red" }}>{errorMsg}</p>;
//   }

//   return (
//     <main className={styles.main}>
//       <h1 className={styles.heading}>All Exhibitions</h1>

//       {exhibitions.length === 0 ? (
//         <p>No exhibitions found.</p>
//       ) : (
//         <ul className={styles.list}>
//           {exhibitions.map((exhibition) => (
//             <li key={exhibition.id} className={styles.listItem}>
//                 <ExhibitionCard exhibition={exhibition} />
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }
