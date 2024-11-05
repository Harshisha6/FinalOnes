import { createContext, useState, useEffect } from "react";
import { registerService, loginService, checkAuthService } from "@/services";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [authState, setAuthState] = useState({
    authenticate: false,
    user: null,
    role: null,
  });
  const [loading, setLoading] = useState(true);

  async function handleRegisterUser(event) {
    event.preventDefault();
    try {
      const data = await registerService(signUpFormData);
      if (data && data.user) {
        setAuthState({ authenticate: true, user: data.user, role: data.role });
      } else {
        setAuthState({ authenticate: false, user: null, role: null });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setAuthState({ authenticate: false, user: null, role: null });
    }
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    const response = await loginService(signInFormData);
    if (response.success) {
      setAuthState({
        authenticate: true,
        user: response.data.user,
        role: response.data.role,
      });
    } else {
      setAuthState({ authenticate: false, user: null, role: null });
    }
  }

  async function handleForgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      toast.error("Error sending password reset email. Please try again.");
    }
  }

  function resetCredentials() {
    setAuthState({ authenticate: false, user: null, role: null });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const authData = await checkAuthService();
        if (authData.success) {
          setAuthState({
            authenticate: true,
            user: authData.data.user,
            role: authData.data.role,
          });
        } else {
          setAuthState({ authenticate: false, user: null, role: null });
        }
      } else {
        setAuthState({ authenticate: false, user: null, role: null });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        handleForgotPassword, // Add this to the context
        resetCredentials,
        authState,
      }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}
