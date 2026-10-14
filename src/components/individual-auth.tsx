import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = { nome: string; matricula: string };
type Account = { user: User | null; profile: Profile | null; ready: boolean; refresh: () => Promise<void> };
const AccountContext = createContext<Account>({ user: null, profile: null, ready: false, refresh: async () => {} });
export function IndividualAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = async () => {
    const { data: { user: current } } = await supabase.auth.getUser();
    setUser(current);
    if (current) {
      const { data } = await supabase.from("profiles").select("nome,matricula").eq("id", current.id).maybeSingle();
      setProfile(data);
    } else setProfile(null);
    setReady(true);
  };
  useEffect(() => {
    void refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) {
        if (event === "SIGNED_OUT") { setUser(null); setProfile(null); }
        // Auth callbacks must not await another auth request under the auth lock.
        setTimeout(() => { void refresh(); }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return <AccountContext.Provider value={{ user, profile, ready, refresh }}>{children}</AccountContext.Provider>;
}
export const useIndividualAccount = () => useContext(AccountContext);
