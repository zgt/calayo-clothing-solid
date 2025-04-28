import { useNavigate } from "@solidjs/router";

export default function SignIn() {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <button
      onClick={handleSignIn}
      class="bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-md px-4 py-2 text-sm font-medium transition-colors"
      aria-label="Sign In"
    >
      Sign In
    </button>
  );
}