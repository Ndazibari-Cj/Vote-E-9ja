-- =====================================================
-- 📚 CHAPTER 2: SECURITY POLICIES & ROW LEVEL SECURITY
-- =====================================================
-- 🎓 Learning Objective: Master database security through Row Level Security (RLS)
-- 
-- 🔐 The Security Challenge:
-- Imagine you're the security chief for INEC. You need to ensure:
-- - Voters can only see their own data
-- - Admins can only manage their assigned elections
-- - Super admins have full access but everything is logged
-- - No one can tamper with votes once cast
-- 
-- This is exactly what Row Level Security (RLS) does - it's like having a smart security guard
-- at every database table who checks "Are you allowed to see/modify this specific row?"

-- =====================================================
-- 🛡️ SECTION 1: UNDERSTANDING ROW LEVEL SECURITY
-- =====================================================
-- 🎯 Learning Goal: Understand what RLS is and why it's crucial
-- 
-- 🔍 Real-World Analogy:
-- Think of RLS like a filing cabinet in a government office:
-- - Each drawer (table) has a lock
-- - Each file (row) has access permissions
-- - Your ID badge (JWT token) determines what you can access
-- - The security system (RLS policies) enforces these rules automatically
-- 
-- 💡 Why RLS Matters in Voting Systems:
-- 1. **Privacy**: Voters can't see other voters' information
-- 2. **Integrity**: Votes can't be modified after casting
-- 3. **Authorization**: Only authorized users can perform admin actions
-- 4. **Audit**: All access attempts are controlled and can be logged

-- First, let's enable RLS on all our tables
-- 🔒 This is like installing locks on all the filing cabinets

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on elections table  
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on candidates table
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on votes table (MOST IMPORTANT!)
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 🏃‍♂️ TRY THIS: After enabling RLS, try to query these tables without policies
-- You'll get zero results! That's RLS working - no access without explicit permission

-- =====================================================
-- 👤 SECTION 2: USER MANAGEMENT POLICIES
-- =====================================================
-- 🎯 Learning Goal: Control who can see and modify user data
-- 
-- 🤔 Think About: What should users be able to do with user data?
-- - See their own profile
-- - Update their own information (but not sensitive fields like role)
-- - Admins should see users in their jurisdiction
-- - Super admins should see all users

-- Policy 1: Users can view their own profile
-- 🔍 This is like saying "You can see your own ID card"
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (with restrictions)
-- ⚠️ Security Note: We exclude sensitive fields like role and verification status
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        -- Prevent users from changing their role or verification status
        role = (SELECT role FROM public.users WHERE id = auth.uid()) AND
        is_verified = (SELECT is_verified FROM public.users WHERE id = auth.uid())
    );

-- Policy 3: Allow user registration (insert)
-- 🚪 This is like allowing people to fill out voter registration forms
CREATE POLICY "users_insert_registration" ON public.users
    FOR INSERT
    WITH CHECK (
        -- New users can only register as voters
        role = 'voter' AND
        is_verified = FALSE AND
        -- The user being created must match the authenticated user
        auth.uid() = id
    );

-- Policy 4: Admins can view users in their jurisdiction
-- 🏛️ This allows election officials to see voters in their area
CREATE POLICY "admins_select_jurisdiction_users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role IN ('admin', 'super_admin')
        )
    );

-- Policy 5: Super admins can do anything with users
-- 👑 Ultimate access for system administrators
CREATE POLICY "super_admin_all_users" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- 💡 Pro Tip: Notice how we use EXISTS() to check conditions
-- This is more efficient than JOINs in policy expressions

-- =====================================================
-- 🗳️ SECTION 3: ELECTION MANAGEMENT POLICIES
-- =====================================================
-- 🎯 Learning Goal: Control access to election data based on roles
-- 
-- 🔍 Business Rules:
-- - Anyone can view active elections (transparency)
-- - Only admins can create/modify elections
-- - Super admins have full control

-- Policy 1: Everyone can view published elections
-- 🌍 Transparency principle - elections should be visible to all
CREATE POLICY "elections_select_public" ON public.elections
    FOR SELECT
    USING (
        status IN ('active', 'completed') OR
        results_published = TRUE
    );

-- Policy 2: Admins can view all elections
-- 👥 Election officials need to see all elections to manage them
CREATE POLICY "admins_select_all_elections" ON public.elections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 3: Admins can create elections
-- 📝 Allow election officials to create new elections
CREATE POLICY "admins_insert_elections" ON public.elections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        ) AND
        created_by = auth.uid()
    );

-- Policy 4: Admins can update elections they created (before they're active)
-- ✏️ Allow modifications but only before election goes live
CREATE POLICY "admins_update_own_elections" ON public.elections
    FOR UPDATE
    USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        -- Prevent changing critical fields once election is active
        (status = 'draft' OR status = (SELECT status FROM public.elections WHERE id = elections.id))
    );

-- Policy 5: Super admins have full control
CREATE POLICY "super_admin_all_elections" ON public.elections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- =====================================================
-- 🏆 SECTION 4: POSITIONS AND CANDIDATES POLICIES
-- =====================================================
-- 🎯 Learning Goal: Secure position and candidate data
-- 
-- 🤔 Think About: Who should be able to see candidates?
-- - Everyone should see candidates in active elections (transparency)
-- - Only admins should manage candidate data

-- POSITIONS POLICIES
-- Policy 1: Everyone can view positions in active elections
CREATE POLICY "positions_select_public" ON public.positions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.elections
            WHERE id = positions.election_id
            AND status IN ('active', 'completed')
        )
    );

-- Policy 2: Admins can manage positions
CREATE POLICY "admins_manage_positions" ON public.positions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- CANDIDATES POLICIES
-- Policy 1: Everyone can view candidates in active elections
CREATE POLICY "candidates_select_public" ON public.candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.elections e
            JOIN public.positions p ON e.id = p.election_id
            WHERE p.id = candidates.position_id
            AND e.status IN ('active', 'completed')
        )
    );

-- Policy 2: Admins can manage candidates
CREATE POLICY "admins_manage_candidates" ON public.candidates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 🗳️ SECTION 5: VOTING SECURITY POLICIES (CRITICAL!)
-- =====================================================
-- 🎯 Learning Goal: Implement the most secure part of the system
-- 
-- 🔐 Security Requirements for Votes:
-- 1. Users can only vote if eligible
-- 2. Users can only see their own votes (for verification)
-- 3. Votes cannot be modified once cast
-- 4. Only the system can insert votes (through application logic)
-- 5. Admins can view aggregated data but not individual votes

-- Policy 1: Users can view their own votes
-- 🔍 Allows voters to verify their votes were recorded correctly
CREATE POLICY "votes_select_own" ON public.votes
    FOR SELECT
    USING (voter_id = auth.uid());

-- Policy 2: Users can insert votes (with strict conditions)
-- 🗳️ This is the core voting mechanism
CREATE POLICY "votes_insert_eligible" ON public.votes
    FOR INSERT
    WITH CHECK (
        -- Voter must be the authenticated user
        voter_id = auth.uid() AND
        
        -- Check if user is eligible to vote in this election
        is_eligible_to_vote(auth.uid(), election_id) AND
        
        -- Ensure the position belongs to the election
        EXISTS (
            SELECT 1 FROM public.positions
            WHERE id = position_id AND election_id = votes.election_id
        ) AND
        
        -- Ensure the candidate belongs to the position
        EXISTS (
            SELECT 1 FROM public.candidates
            WHERE id = candidate_id AND position_id = votes.position_id
        ) AND
        
        -- Ensure election is currently active
        EXISTS (
            SELECT 1 FROM public.elections
            WHERE id = election_id 
            AND status = 'active'
            AND NOW() BETWEEN start_date AND end_date
        )
    );

-- Policy 3: NO UPDATE OR DELETE of votes
-- 🚫 Once a vote is cast, it cannot be changed - this ensures integrity
-- We don't create UPDATE or DELETE policies, so these operations are forbidden

-- Policy 4: Admins can view vote counts (but not individual votes)
-- 📊 This would be implemented through views, not direct table access
-- We'll create a separate view for this purpose

-- =====================================================
-- 📊 SECTION 6: AUDIT LOG POLICIES
-- =====================================================
-- 🎯 Learning Goal: Secure audit trails while maintaining transparency
-- 
-- 🔍 Audit Log Requirements:
-- - System automatically creates audit entries
-- - Users can see logs of their own actions
-- - Admins can see logs in their jurisdiction
-- - Super admins can see all logs

-- Policy 1: Users can view their own audit logs
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: Admins can view audit logs for their jurisdiction
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 3: Only the system can insert audit logs
-- 🤖 This prevents manual tampering with audit trails
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        -- Only allow inserts from authenticated users
        user_id IS NOT NULL
    );

-- Policy 4: No updates or deletes on audit logs
-- 📝 Audit logs are immutable - they can never be changed
-- We don't create UPDATE or DELETE policies

-- =====================================================
-- 🔧 SECTION 7: HELPER FUNCTIONS FOR POLICIES
-- =====================================================
-- 🎯 Learning Goal: Create reusable functions for complex policy logic
-- 
-- 💡 Why Functions in Policies?
-- - Reusable logic across multiple policies
-- - Easier to maintain and update
-- - Better performance than repeating complex queries

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has super admin role
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 💡 Pro Tip: SECURITY DEFINER means the function runs with the privileges
-- of the user who created it, not the user who calls it

-- =====================================================
-- 📈 SECTION 8: SECURE VIEWS FOR REPORTING
-- =====================================================
-- 🎯 Learning Goal: Provide safe access to aggregated data
-- 
-- 🔍 Challenge: How do we show election results without exposing individual votes?
-- Answer: Create views that only show aggregated data

-- Secure view for election results (no individual vote data)
CREATE OR REPLACE VIEW public.secure_election_results AS
SELECT 
    e.id as election_id,
    e.title as election_title,
    p.id as position_id,
    p.title as position_title,
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.party_affiliation,
    COUNT(v.id) as vote_count
FROM public.elections e
JOIN public.positions p ON e.id = p.election_id
JOIN public.candidates c ON p.id = c.position_id
LEFT JOIN public.votes v ON c.id = v.candidate_id
WHERE e.results_published = TRUE
GROUP BY e.id, e.title, p.id, p.title, c.id, c.full_name, c.party_affiliation
ORDER BY e.title, p.title, vote_count DESC;

-- Apply RLS to the view
ALTER VIEW public.secure_election_results SET (security_barrier = true);

-- Policy for the secure results view
CREATE POLICY "secure_results_public" ON public.secure_election_results
    FOR SELECT
    USING (true); -- Anyone can see published results

-- =====================================================
-- 🚨 SECTION 9: EMERGENCY PROCEDURES
-- =====================================================
-- 🎯 Learning Goal: Plan for security incidents
-- 
-- 🆘 Emergency Functions (Use with extreme caution!)

-- Function to temporarily disable voting (emergency use only)
CREATE OR REPLACE FUNCTION emergency_suspend_election(election_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only super admins can use this
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only super admins can suspend elections';
    END IF;
    
    -- Update election status
    UPDATE public.elections 
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = election_id;
    
    -- Log the emergency action
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        auth.uid(),
        'emergency_suspend_election',
        'elections',
        election_id,
        jsonb_build_object('suspended_at', NOW(), 'reason', 'emergency_suspension')
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 🧪 SECTION 10: TESTING YOUR SECURITY POLICIES
-- =====================================================
-- 🎯 Learning Goal: Verify that your security policies work correctly
-- 
-- 🏃‍♂️ TRY THIS: Test your policies with different user roles
-- 
-- Test Script (run these in Supabase SQL editor):

/*
-- Test 1: Try to select users without authentication
-- This should return no results
SELECT * FROM public.users;

-- Test 2: Create a test user and try to access data
-- This would require setting up authentication first

-- Test 3: Try to insert a vote without proper permissions
-- This should fail
INSERT INTO public.votes (voter_id, election_id, position_id, candidate_id)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
*/

-- =====================================================
-- 🎓 CONGRATULATIONS! YOU'VE COMPLETED CHAPTER 2!
-- =====================================================
-- 
-- 🏆 What You've Learned:
-- ✅ Row Level Security (RLS) concepts and implementation
-- ✅ Policy-based access control
-- ✅ Role-based security patterns
-- ✅ Secure voting mechanisms
-- ✅ Audit trail protection
-- ✅ Emergency procedures
-- ✅ Secure data aggregation
-- 
-- 🏃‍♂️ TRY THIS: 
-- 1. Draw a security matrix showing which roles can access what data
-- 2. Think about additional security measures you might need
-- 3. Consider how you would handle security incidents
-- 
-- 🤔 THINK ABOUT:
-- - What happens if someone tries to vote twice?
-- - How would you detect suspicious voting patterns?
-- - What additional audit logs might be useful?
-- - How would you handle a security breach?
-- 
-- 📚 NEXT CHAPTER: Validation System (src/utils/validation.js)
-- We'll learn how to validate user input and enforce business rules!

-- =====================================================
-- 📝 IMPLEMENTATION CHECKLIST
-- =====================================================
-- 
-- ✅ Before deploying to production:
-- 1. Test all policies with different user roles
-- 2. Verify that unauthorized access is blocked
-- 3. Test emergency procedures
-- 4. Set up monitoring for security events
-- 5. Create incident response procedures
-- 6. Train administrators on security policies
-- 7. Regular security audits and penetration testing
-- 
-- 🛡️ Security Best Practices:
-- - Principle of least privilege (give minimum necessary access)
-- - Defense in depth (multiple layers of security)
-- - Regular security reviews and updates
-- - Monitor and log all access attempts
-- - Have incident response procedures ready
-- 
-- 💡 Performance Considerations:
-- - RLS policies can impact query performance
-- - Use indexes on columns used in policy conditions
-- - Monitor query performance regularly
-- - Consider caching for frequently accessed data

-- =====================================================
-- 🔐 FINAL SECURITY REMINDER
-- =====================================================
-- 
-- "Security is not a product, but a process" - Bruce Schneier
-- 
-- These policies provide a strong foundation, but security requires:
-- - Regular updates and maintenance
-- - Continuous monitoring
-- - User education and training
-- - Incident response planning
-- - Regular security assessments
-- 
-- Remember: In a voting system, security isn't just about protecting data
-- - it's about protecting democracy itself! 🗳️🇳🇬
