import { useState, useEffect } from "react";
import { auth, FirebaseUser } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { onAuthStateChanged } from "firebase/auth";

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            // Register or update user in our API
            await apiRequest("POST", "/api/users", {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || null,
            });
          } catch (err) {
            console.error("Failed to sync user with database:", err);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
