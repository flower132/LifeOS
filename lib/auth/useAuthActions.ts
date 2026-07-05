"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { setMode, signOut as storageSignOut } from "@/lib/storage";
import {
  setMigrationPending,
  abandonMigration,
} from "@/lib/sync/MigrationService";
import { useSyncStore } from "@/stores/syncStore";
import { updateUserProfile } from "@/lib/sync/SyncService";
import type { UserProfile } from "@/lib/sync/types";

function buildProfileFromUser(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): UserProfile {
  const email = user.email ?? "";
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name.length > 0
      ? metadata.display_name
      : email.split("@")[0] ?? "";
  const avatarEmoji =
    typeof metadata.avatar_emoji === "string" ? metadata.avatar_emoji : undefined;
  return { email, displayName, avatarEmoji };
}

export function useAuthActions() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          const profile = buildProfileFromUser(data.user);
          setUser(profile);
          useSyncStore.getState().setProfile(profile);
        }
      })
      .catch(() => {
        // ignore
      });

    const { data: listener } = getSupabase().auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const profile = buildProfileFromUser(session.user);
          setUser(profile);
          useSyncStore.getState().setProfile(profile);
        } else {
          setUser(null);
          useSyncStore.getState().setProfile(null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setSuccessMsg(null);
      setLoading(true);
      try {
        const { error: signInError } = await getSupabase()
          .auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            setError("邮箱未验证，请先点击邮箱中的确认链接。");
          } else {
            throw signInError;
          }
          return false;
        }
        const { data } = await getSupabase().auth.getUser();
        if (data.user) {
          setMode("sync");
          setMigrationPending(data.user.id);
          router.push("/migration");
          return true;
        }
        return false;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setSuccessMsg(null);
      setLoading(true);
      try {
        const { data, error: signUpError } = await getSupabase().auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setSuccessMsg("注册成功！请检查邮箱 " + email + " 中的确认链接。");
          return false;
        }

        if (data.user) {
          setMode("sync");
          setMigrationPending(data.user.id);
          router.push("/migration");
          return true;
        }
        return false;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signOut = useCallback(async () => {
    await storageSignOut();
    setUser(null);
    setError(null);
    setSuccessMsg(null);
    useSyncStore.getState().setProfile(null);
    useSyncStore.getState().reset();
    router.push("/home");
  }, [router]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      await updateUserProfile(updates);
      const { data } = await getSupabase().auth.getUser();
      if (data.user) {
        const profile = buildProfileFromUser(data.user);
        setUser(profile);
        useSyncStore.getState().setProfile(profile);
      }
    },
    []
  );

  const continueLocal = useCallback(() => {
    setMode("local");
    abandonMigration();
    router.push("/home");
  }, [router]);

  return {
    user,
    loading,
    error,
    successMsg,
    signIn,
    signUp,
    signOut,
    updateProfile,
    continueLocal,
    setError,
    setSuccessMsg,
  };
}
