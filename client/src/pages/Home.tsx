import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to Dashboard on page load
    setLocation("/dashboard");
  }, [setLocation]);

  return null;
}
