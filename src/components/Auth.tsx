import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user already logged in
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Handle login
  const signInWithProvider = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) alert("Login failed: " + error.message);
  };

  // Handle logout
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-700">Hello, {user.email}</p>
        <button
          onClick={signOut}
          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => signInWithProvider("google")}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Sign in with Google
      </button>
      <button
        onClick={() => signInWithProvider("github")}
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
