import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ArtistProfile from "./ArtistProfile";

const ArtistBySlug = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolveSlug = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", slug)
        .eq("tipo", "artista")
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setArtistId(data.id);
      }
      setLoading(false);
    };

    resolveSlug();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    navigate("/404", { replace: true });
    return null;
  }

  if (artistId) {
    return <ArtistProfile artistId={artistId} />;
  }

  return null;
};

export default ArtistBySlug;
