import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function AuthListener() {
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session && window.location.pathname === '/') {
            navigate('/dashboard');
        }
        })
    }, [])
    return null
}

export default AuthListener