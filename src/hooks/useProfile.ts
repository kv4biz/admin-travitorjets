//src/hooks/useProfile.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "staff" | "manager" | "user";
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();
        setProfile(data as Profile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  return { profile, loading };
}
