import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    try {
        const auth = req.headers.authorization || "";
        const m = auth.match(/^Bearer (.+)$/);
        if (!m) return res.status(401).json({ error: "Missing Bearer token" });

        const token = m[1];

        // Supabase client using the user's JWT (RLS applies)
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            return res.status(401).json({ error: "Invalid session", details: userError?.message });
        }

        const user = userData.user;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id,email,role,plan,created_at")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return res.status(500).json({ error: "Failed to load profile", details: profileError.message });
        }

        return res.status(200).json({
            user: { id: user.id, email: user.email },
            profile
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Server error" });
    }
}
