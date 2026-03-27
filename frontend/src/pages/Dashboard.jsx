import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from 'react-hot-toast'

import Sidebar from "../components/Sidebar";

// const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const API_BASE = "http://127.0.0.1:8000";

function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [user, setUser] = useState(null);

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

    if (loading) return;

    return (
        <div>
            <Sidebar />
             <main className="ml-64 p-8 min-h-screen bg-bg">
                <Outlet context={{ clients, setClients, clientsLoading, user }} />
            </main>
        </div>
    );
}

export default Dashboard