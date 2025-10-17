// types/favouritedArtwork.ts
import { UnifiedArtwork } from "./unifiedArtwork";

export interface FavouritedArtwork extends UnifiedArtwork {
  favouriteId: string;
}
