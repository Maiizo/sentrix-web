import type { Metadata } from "next";
import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = {
  title: "Create an account | Sentrix",
  description: "Create your Sentrix account.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
