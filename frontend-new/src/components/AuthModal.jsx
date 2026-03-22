import { supabase } from "../supabase"

async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard',
        }
    })
    if (error) {
        console.error('Error signing in with Google:', error.message)
    }
}
function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div>
      <h2>Sign in to Orkly</h2>
      <button 
        onClick={signInWithGoogle}
        className="flex items-center gap-3 w-full border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors font-medium"
    >
        Continue with Google
     </button>
      <button onClick={onClose}>
        Close
      </button>
    </div>
  )
}

export default AuthModal