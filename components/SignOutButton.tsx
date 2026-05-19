"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Signed out successfully.");
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out.");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-primary-100 hover:text-white transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
