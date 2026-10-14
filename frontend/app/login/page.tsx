import type { Metadata } from "next";
import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = {
  title: "Log in | Sentrix",
  description: "Log in to your Sentrix operations workspace.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
