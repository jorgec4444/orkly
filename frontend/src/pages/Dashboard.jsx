import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from 'react-hot-toast'
import Sidebar from "../components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast('Please sign in to access the dashboard')
                navigate("/");
                return;
            }
            const data = await fetch(`${API_BASE}/client/list`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const json = await data.json();
            setUser(session.user);
            setClients(json);
            setClientsLoading(false);
            setLoading(false);
        }
        checkSession();
    }, []);

    if (loading) return null;

    return (
        <div className="flex min-h-screen bg-bg">
            {/* Overlay móvil */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 lg:ml-64">
                {/* Header móvil */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-primary">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-white p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-white font-bold text-lg">Orkly</span>
                </div>

                <main className="p-4 md:p-8">
                    <Outlet context={{ clients, setClients, clientsLoading, user }} />
                </main>
            </div>
        </div>
    );
}

export default Dashboard;