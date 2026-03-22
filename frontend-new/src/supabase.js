import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fmesbvfmwaumkauguxda.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZXNidmZtd2F1bWthdWd1eGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTI2MTUsImV4cCI6MjA4OTE4ODYxNX0.J9PbD4L6A1SkE2djYS_-ZogYvCurVLYQ4hpktccO3Gs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)