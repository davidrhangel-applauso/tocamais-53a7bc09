import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  tipo: "artista" | "cliente" | "estabelecimento";
}

const sanitizeTipo = (
  tipo: unknown,
  fallback: Profile["tipo"]
): Profile["tipo"] => {
  if (tipo === "artista" || tipo === "cliente" || tipo === "estabelecimento") {
    return tipo;
  }
  return fallback;
};

/**
 * Waits for a user profile to be created in the database.
 * Uses retry logic to handle the async trigger that creates profiles.
 */
export const waitForProfile = async (
  userId: string,
  maxAttempts: number = 10,
  delayMs: number = 500
): Promise<Profile | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tipo")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      return profile;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
};

const createMissingProfile = async (
  user: User,
  fallbackTipo: Profile["tipo"]
): Promise<void> => {
  const nomeFromEmail = user.email?.split("@")[0];
  const tipo = sanitizeTipo(user.user_metadata?.tipo, fallbackTipo);

  const profilePayload = {
    id: user.id,
    nome:
      user.user_metadata?.nome?.toString().trim() ||
      nomeFromEmail ||
      "Usuário",
    cidade: user.user_metadata?.cidade?.toString() || null,
    tipo,
    foto_url: user.user_metadata?.foto_url?.toString() || null,
    endereco: user.user_metadata?.endereco?.toString() || null,
    telefone: user.user_metadata?.telefone?.toString() || null,
    tipo_estabelecimento:
      user.user_metadata?.tipo_estabelecimento?.toString() || null,
  };

  const { error } = await supabase.from("profiles").upsert(profilePayload, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw error;
  }
};

const inferProfileFromMetadata = (
  user: User,
  fallbackTipo: Profile["tipo"]
): Profile => ({
  id: user.id,
  tipo: sanitizeTipo(user.user_metadata?.tipo, fallbackTipo),
});

export const ensureProfileForUser = async (
  user: User,
  fallbackTipo: Profile["tipo"]
): Promise<Profile | null> => {
  try {
    const existingProfile = await waitForProfile(user.id, 6, 400);
    if (existingProfile) return existingProfile;
  } catch (error) {
    console.error("[auth] Falha ao buscar perfil existente:", error);
  }

  try {
    await createMissingProfile(user, fallbackTipo);
  } catch (error) {
    console.error("[auth] Falha ao criar perfil automaticamente:", error);
  }

  try {
    const recoveredProfile = await waitForProfile(user.id, 8, 400);
    if (recoveredProfile) return recoveredProfile;
  } catch (error) {
    console.error("[auth] Falha ao recuperar perfil após criação:", error);
  }

  console.warn("[auth] Usando perfil inferido por fallback para evitar loop de login", {
    userId: user.id,
    fallbackTipo,
  });
  return inferProfileFromMetadata(user, fallbackTipo);
};
