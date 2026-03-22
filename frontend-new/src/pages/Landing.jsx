import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"
import AuthModal from "../components/AuthModal"


function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/dashboard')
      }
    }
    checkSession()
  }, [])

  return (
    <div>
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-light transition-colors">
          Sign In
      </button>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}

export default Landing