import { NavLink } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "../supabase"


function Sidebar() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        async function getUserFromSession() {
            const { data: { user} } = await supabase.auth.getUser()
            setUser(user)
        }
        getUserFromSession()
    }, [])

    return (
        <aside className="w-64 h-screen bg-primary flex flex-col fixed left-0 top-0">
        
        <div className="px-4 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
                <NavLink to="/" className="flex items-center gap-3 px-2 py-1 rounded-lg text-white/80 hover:bg-white/10 transition-colors">
                    <img src="/orkly_icon_sidebar.svg" alt="Orkly Icon" className="w-11 h-11" />
                </NavLink>
                <span className="text-white font-bold text-xl">Orkly</span>
            </div>
        </div>

        <nav className="flex-1 p-4">
            <ul className="space-y-1">
                <li>
                <NavLink 
                    to="/dashboard/clients"
                    className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                    }
                >
                    Clients
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/dashboard/create"
                    className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                    }
                >
                    Create content
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/dashboard/settings"
                    className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                    }
                >
                    Settings
                </NavLink>
                </li>
            </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
            <span className="text-white/60 text-sm">{user?.email}</span>
        </div>

        </aside>
  )
}

export default Sidebar