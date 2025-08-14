-- =====================================================
-- 📚 CHAPTER 1: DATABASE ARCHITECTURE
-- =====================================================
-- 🎓 Learning Objective: Understand how to design a secure, scalable database for a voting system
-- 
-- 🤔 Think About This: 
-- Imagine you're designing the filing system for INEC (Independent National Electoral Commission).
-- How would you organize voter records, election data, and ensure everything is secure and auditable?
-- 
-- That's exactly what we're doing here - but digitally!

-- =====================================================
-- 🏗️ SECTION 1: FOUNDATION SETUP
-- =====================================================
-- 💡 Pro Tip: Always start with extensions and basic setup
-- Think of this like installing the right tools before building a house

-- Enable UUID extension for generating unique identifiers
-- 🔍 Real-World Analogy: UUIDs are like Nigerian National ID numbers - globally unique
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security (RLS) - this is CRUCIAL for voting systems
-- 🛡️ Security Note: RLS ensures users can only see/modify data they're authorized to access
-- Think of it like having different security clearance levels in a government building
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-super-secret-jwt-token-here';

-- =====================================================
-- 🏛️ SECTION 2: USER MANAGEMENT SYSTEM
-- =====================================================
-- 🎯 Learning Goal: Understand how to store user information securely
-- 
-- 🤔 Think About: What information do we need to store about each voter?
-- - Personal details (name, contact info)
-- - Verification data (NIN, age verification)
-- - System data (when they registered, their role)
-- - Security data (handled by Supabase Auth)

-- Users table - extends Supabase's built-in auth.users
-- 📝 Design Decision: We extend rather than replace Supabase auth for security
CREATE TABLE public.users (
    -- Primary key that links to Supabase auth system
    -- 🔗 Connection: This UUID matches the user's ID in auth.users
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Personal Information Section
    -- 📋 Nigerian Context: We collect names as they appear on official documents
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100), -- Optional: Some Nigerians use surname differently
    
    -- Contact Information
    -- 📱 Nigerian Phone Format: We'll validate this in our app (080, 081, 070, etc.)
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    
    -- Identity Verification
    -- 🆔 NIN (National Identification Number): 11-digit unique identifier
    -- Making it optional initially, but recommended for enhanced security
    nin VARCHAR(11) UNIQUE,
    
    -- Demographics (required for voting eligibility)
    date_of_birth DATE NOT NULL, -- Must be 18+ to vote
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    
    -- Address Information
    -- 🏠 Important: Determines voting constituency
    address TEXT NOT NULL,
    occupation VARCHAR(100),
    
    -- System Role Management
    -- 🎭 Role-Based Access Control (RBAC)
    -- voter: Can vote in elections
    -- admin: Can manage elections in their constituency  
    -- super_admin: Can manage the entire system
    role VARCHAR(20) DEFAULT 'voter' CHECK (role IN ('voter', 'admin', 'super_admin')),
    
    -- Account Status Management
    -- ✅ Email verification is handled by Supabase Auth
    -- 🔐 Additional verification for high-security voting
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- 'email', 'phone', 'nin', 'manual'
    
    -- Audit Trail - ALWAYS important in voting systems
    -- 📅 Timestamps help us track when accounts were created/modified
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security Metadata
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- 🏃‍♂️ TRY THIS: After creating this table, think about:
-- 1. What happens if someone tries to register with the same phone number twice?
-- 2. How do we ensure only adults can register?
-- 3. What additional fields might be needed for different types of elections?

-- =====================================================
-- 🗳️ SECTION 3: ELECTION MANAGEMENT SYSTEM
-- =====================================================
-- 🎯 Learning Goal: Design tables that can handle multiple elections simultaneously
-- 
-- 🔍 Real-World Context: Nigeria has different types of elections:
-- - Presidential Elections
-- - Gubernatorial Elections  
-- - Local Government Elections
-- - By-elections

-- Elections table - stores information about each election
CREATE TABLE public.elections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Election Identification
    title VARCHAR(200) NOT NULL, -- e.g., "2027 Presidential Election"
    description TEXT,
    
    -- Election Type Classification
    -- 🏛️ Nigerian Electoral System: Different levels of government
    election_type VARCHAR(50) NOT NULL CHECK (
        election_type IN ('presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'local_government')
    ),
    
    -- Geographic Scope
    -- 🗺️ Determines who can vote in this election
    constituency VARCHAR(100), -- e.g., "Lagos State", "Ikeja Federal Constituency"
    state VARCHAR(50),
    local_government VARCHAR(100),
    
    -- Election Timeline
    -- ⏰ Critical: These dates determine when voting is active
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Election Status Management
    -- 📊 Workflow: draft → active → completed → archived
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'active', 'completed', 'cancelled', 'archived')
    ),
    
    -- Results and Transparency
    results_published BOOLEAN DEFAULT FALSE,
    results_published_at TIMESTAMP WITH TIME ZONE,
    
    -- Administrative Information
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data Integrity Constraints
    -- ⚠️ Business Rule: End date must be after start date
    CONSTRAINT valid_election_dates CHECK (end_date > start_date)
);

-- 💡 Pro Tip: Always add constraints to enforce business rules at the database level
-- This prevents invalid data even if application code has bugs

-- =====================================================
-- 🏆 SECTION 4: POSITIONS AND CANDIDATES
-- =====================================================
-- 🎯 Learning Goal: Model the relationship between elections, positions, and candidates
-- 
-- 🤔 Think About: In a presidential election, there's one position (President) but multiple candidates
-- In a state election, there might be multiple positions (Governor, Deputy Governor, etc.)

-- Positions table - defines what roles are being voted for
CREATE TABLE public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Link to parent election
    -- 🔗 Foreign Key Relationship: Each position belongs to one election
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    
    -- Position Details
    title VARCHAR(100) NOT NULL, -- e.g., "President", "Governor", "Senator"
    description TEXT,
    
    -- Voting Rules
    -- 🗳️ Some positions allow multiple winners (e.g., House of Representatives)
    max_selections INTEGER DEFAULT 1, -- How many candidates can a voter choose?
    
    -- Display Order (for ballot organization)
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table - stores information about people running for positions
CREATE TABLE public.candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Link to position they're running for
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
    
    -- Candidate Information
    -- 📋 Note: This is separate from users table because not all candidates need system accounts
    full_name VARCHAR(200) NOT NULL,
    party_affiliation VARCHAR(100), -- e.g., "APC", "PDP", "LP"
    biography TEXT,
    
    -- Campaign Information
    campaign_slogan VARCHAR(500),
    manifesto TEXT,
    
    -- Media Assets
    photo_url VARCHAR(500), -- Link to candidate's photo
    
    -- Ballot Information
    ballot_number INTEGER, -- Position on the ballot
    ballot_symbol VARCHAR(100), -- Party symbol or identifier
    
    -- Status Management
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'withdrawn', 'disqualified')
    ),
    
    -- Administrative
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ballot numbers per position
    UNIQUE(position_id, ballot_number)
);

-- 🏃‍♂️ TRY THIS: Draw a diagram showing how elections, positions, and candidates relate to each other
-- Election (1) → Positions (many) → Candidates (many)

-- =====================================================
-- 🗳️ SECTION 5: VOTING SYSTEM
-- =====================================================
-- 🎯 Learning Goal: Design a secure, auditable voting mechanism
-- 
-- 🔐 Security Challenge: How do we ensure:
-- 1. Each person can only vote once per election
-- 2. Votes are anonymous (can't trace back to voter)
-- 3. Votes can be verified and audited
-- 4. System can detect tampering

-- Votes table - the heart of our voting system
CREATE TABLE public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Voter Information
    -- 🔗 Links to the person who cast the vote
    voter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Election Context
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    
    -- Security and Integrity
    -- 🔐 Cryptographic hash for vote verification
    -- This allows us to detect if votes have been tampered with
    vote_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of vote data
    
    -- Audit Trail
    -- 📅 Precise timing helps detect suspicious patterns
    cast_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Technical Metadata
    -- 🌐 Helps detect unusual voting patterns
    ip_address INET, -- Voter's IP address
    user_agent TEXT, -- Browser/device information
    
    -- Prevent duplicate voting
    -- ⚠️ Business Rule: One vote per voter per position per election
    UNIQUE(voter_id, election_id, position_id)
);

-- 💡 Pro Tip: The UNIQUE constraint prevents double voting at the database level
-- Even if application code has bugs, the database will reject duplicate votes

-- =====================================================
-- 📊 SECTION 6: AUDIT AND TRANSPARENCY
-- =====================================================
-- 🎯 Learning Goal: Implement comprehensive audit logging
-- 
-- 🔍 Why Audit Logs Matter:
-- - Track all system activities
-- - Detect suspicious behavior
-- - Provide transparency for election observers
-- - Help debug issues

-- Audit logs table - tracks all important system activities
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Who performed the action?
    user_id UUID REFERENCES public.users(id),
    
    -- What action was performed?
    action VARCHAR(100) NOT NULL, -- e.g., 'vote_cast', 'user_registered', 'election_created'
    
    -- What was affected?
    table_name VARCHAR(50), -- Which database table was affected
    record_id UUID, -- Which specific record was affected
    
    -- Detailed information
    old_values JSONB, -- What the data looked like before
    new_values JSONB, -- What the data looks like after
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🏃‍♂️ TRY THIS: Think about what actions should be logged:
-- - User registration and login
-- - Vote casting
-- - Election creation and modification
-- - Admin actions
-- What else can you think of?

-- =====================================================
-- 🔧 SECTION 7: HELPER FUNCTIONS
-- =====================================================
-- 🎯 Learning Goal: Use database functions to automate common tasks
-- 
-- 💡 Why Functions?: They ensure consistency and reduce code duplication

-- Function to automatically update the updated_at timestamp
-- 🕒 This runs automatically whenever a record is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate vote hash for integrity checking
-- 🔐 This creates a unique fingerprint for each vote
CREATE OR REPLACE FUNCTION generate_vote_hash(
    p_voter_id UUID,
    p_election_id UUID,
    p_position_id UUID,
    p_candidate_id UUID,
    p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS VARCHAR(64) AS $$
BEGIN
    -- Create a hash from vote components
    -- 🔍 This allows us to verify vote integrity without revealing voter identity
    RETURN encode(
        digest(
            p_voter_id::text || 
            p_election_id::text || 
            p_position_id::text || 
            p_candidate_id::text || 
            p_timestamp::text || 
            'vote-salt-2024', -- Secret salt for additional security
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user is eligible to vote in an election
-- ✅ Centralizes voting eligibility logic
CREATE OR REPLACE FUNCTION is_eligible_to_vote(
    p_user_id UUID,
    p_election_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_age INTEGER;
    user_verified BOOLEAN;
    election_active BOOLEAN;
BEGIN
    -- Check if user exists and is verified
    SELECT 
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
        is_verified
    INTO user_age, user_verified
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Check if election is active
    SELECT 
        (status = 'active' AND NOW() BETWEEN start_date AND end_date)
    INTO election_active
    FROM public.elections
    WHERE id = p_election_id;
    
    -- Return eligibility result
    -- 🎯 Business Rules: Must be 18+, verified, and election must be active
    RETURN (
        user_age >= 18 AND 
        user_verified = TRUE AND 
        election_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ⚡ SECTION 8: TRIGGERS FOR AUTOMATION
-- =====================================================
-- 🎯 Learning Goal: Use triggers to automate database tasks
-- 
-- 🤖 Triggers are like "database robots" that automatically perform tasks
-- when certain events happen (INSERT, UPDATE, DELETE)

-- Automatically update timestamps when records change
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elections_updated_at 
    BEFORE UPDATE ON public.elections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON public.positions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON public.candidates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Automatically generate vote hash when vote is cast
-- 🔐 This ensures every vote has a unique, verifiable fingerprint
CREATE OR REPLACE FUNCTION auto_generate_vote_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vote_hash = generate_vote_hash(
        NEW.voter_id,
        NEW.election_id,
        NEW.position_id,
        NEW.candidate_id,
        NEW.cast_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_vote_hash_trigger
    BEFORE INSERT ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_vote_hash();

-- =====================================================
-- 📊 SECTION 9: USEFUL VIEWS FOR REPORTING
-- =====================================================
-- 🎯 Learning Goal: Create views to simplify complex queries
-- 
-- 🔍 Views are like "saved queries" that make complex data easy to access

-- View for election results
-- 📈 This makes it easy to get vote counts for any election
CREATE VIEW election_results AS
SELECT 
    e.title as election_title,
    p.title as position_title,
    c.full_name as candidate_name,
    c.party_affiliation,
    COUNT(v.id) as vote_count,
    -- Calculate percentage of total votes for this position
    ROUND(
        (COUNT(v.id) * 100.0) / 
        NULLIF(SUM(COUNT(v.id)) OVER (PARTITION BY e.id, p.id), 0), 
        2
    ) as vote_percentage
FROM public.elections e
JOIN public.positions p ON e.id = p.election_id
JOIN public.candidates c ON p.id = c.position_id
LEFT JOIN public.votes v ON c.id = v.candidate_id
WHERE e.results_published = TRUE
GROUP BY e.id, e.title, p.id, p.title, c.id, c.full_name, c.party_affiliation
ORDER BY e.title, p.title, vote_count DESC;

-- View for voter statistics
-- 📊 Helps administrators understand voter engagement
CREATE VIEW voter_statistics AS
SELECT 
    e.title as election_title,
    COUNT(DISTINCT u.id) as total_eligible_voters,
    COUNT(DISTINCT v.voter_id) as total_votes_cast,
    ROUND(
        (COUNT(DISTINCT v.voter_id) * 100.0) / 
        NULLIF(COUNT(DISTINCT u.id), 0), 
        2
    ) as turnout_percentage
FROM public.elections e
CROSS JOIN public.users u
LEFT JOIN public.votes v ON e.id = v.election_id AND u.id = v.voter_id
WHERE u.is_verified = TRUE 
    AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) >= 18
GROUP BY e.id, e.title
ORDER BY e.title;

-- =====================================================
-- 🎯 SECTION 10: SAMPLE DATA FOR TESTING
-- =====================================================
-- 🎯 Learning Goal: Understand how to create test data
-- 
-- 💡 Pro Tip: Always create sample data to test your database design
-- This helps you catch design issues early

-- Note: In a real application, you would insert sample data here
-- For now, we'll leave this as comments to show the structure

/*
-- Sample election
INSERT INTO public.elections (title, description, election_type, start_date, end_date, status)
VALUES (
    '2027 Presidential Election',
    'Election to choose the President and Vice President of Nigeria',
    'presidential',
    '2027-02-25 08:00:00+01',
    '2027-02-25 18:00:00+01',
    'draft'
);

-- Sample position
INSERT INTO public.positions (election_id, title, description)
VALUES (
    (SELECT id FROM public.elections WHERE title = '2027 Presidential Election'),
    'President of Nigeria',
    'Head of State and Government of the Federal Republic of Nigeria'
);
*/

-- =====================================================
-- 🎓 CONGRATULATIONS! YOU'VE COMPLETED CHAPTER 1!
-- =====================================================
-- 
-- 🏆 What You've Learned:
-- ✅ Database design principles
-- ✅ Table relationships and foreign keys
-- ✅ Data integrity with constraints
-- ✅ Security with Row Level Security
-- ✅ Automation with triggers and functions
-- ✅ Reporting with views
-- ✅ Audit trails for transparency
-- 
-- 🏃‍♂️ TRY THIS: 
-- 1. Draw an Entity Relationship Diagram (ERD) of all the tables
-- 2. Think about what queries you might need to write
-- 3. Consider what additional tables might be needed for a full voting system
-- 
-- 🤔 THINK ABOUT:
-- - How would you handle vote recounts?
-- - What if an election needs to be extended?
-- - How would you implement voter registration verification?
-- 
-- 📚 NEXT CHAPTER: Security Policies (policies.sql)
-- We'll learn how to implement Row Level Security to protect our data!

-- =====================================================
-- 📝 NOTES FOR IMPLEMENTATION:
-- =====================================================
-- 
-- 🔧 To use this schema:
-- 1. Create a Supabase project
-- 2. Run this SQL in the Supabase SQL editor
-- 3. Set up the security policies (next file)
-- 4. Configure your application environment variables
-- 
-- 🛡️ Security Reminders:
-- - Never store passwords in plain text (Supabase handles this)
-- - Always validate data in both frontend and backend
-- - Use HTTPS in production
-- - Regularly backup your database
-- - Monitor for suspicious activity
-- 
-- 💡 Performance Tips:
-- - Add indexes on frequently queried columns
-- - Use database functions for complex calculations
-- - Consider partitioning for very large datasets
-- - Monitor query performance regularly
