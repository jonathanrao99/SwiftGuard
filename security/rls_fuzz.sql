-- SwiftGuard RLS Fuzz Testing
-- Tests Row-Level Security policies for cross-tenant access prevention

-- Create test users for fuzz testing
DO $$
DECLARE
    test_user_1_id UUID;
    test_user_2_id UUID;
    test_guard_id UUID;
    test_admin_id UUID;
BEGIN
    -- Create test users in auth.users (simulated)
    -- Note: In real testing, these would be created via Supabase Auth
    
    -- Test data setup
    INSERT INTO public.users (id, role, full_name, phone, is_active, created_at)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', 'client', 'Test Client 1', '+1234567890', true, NOW()),
        ('22222222-2222-2222-2222-222222222222', 'client', 'Test Client 2', '+1234567891', true, NOW()),
        ('33333333-3333-3333-3333-333333333333', 'guard', 'Test Guard 1', '+1234567892', true, NOW()),
        ('44444444-4444-4444-4444-444444444444', 'guard', 'Test Guard 2', '+1234567893', false, NOW()),
        ('55555555-5555-5555-5555-555555555555', 'admin', 'Test Admin', '+1234567894', true, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test guard ratings
    INSERT INTO public.guard_ratings (guard_id, rater_id, score, comment, created_at)
    VALUES 
        ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 5, 'Great guard!', NOW()),
        ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 4, 'Good service', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Create test payment methods
    INSERT INTO public.payment_methods (id, user_id, brand, last4, exp_month, exp_year, is_default, created_at)
    VALUES 
        ('pm_test_1111', '11111111-1111-1111-1111-111111111111', 'visa', '1111', 12, 2025, true, NOW()),
        ('pm_test_2222', '22222222-2222-2222-2222-222222222222', 'mastercard', '2222', 11, 2026, true, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test emergency contacts
    INSERT INTO public.emergency_contacts (id, user_id, name, phone, relationship, created_at)
    VALUES 
        ('ec_1111', '11111111-1111-1111-1111-111111111111', 'Emergency Contact 1', '+1987654321', 'spouse', NOW()),
        ('ec_2222', '22222222-2222-2222-2222-222222222222', 'Emergency Contact 2', '+1987654322', 'parent', NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test data created successfully';
END $$;

-- RLS Fuzz Test Functions
CREATE OR REPLACE FUNCTION security.rls_fuzz_test_users()
RETURNS TABLE(test_name TEXT, expected_result TEXT, actual_result TEXT, passed BOOLEAN) AS $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    other_user_id UUID := '22222222-2222-2222-2222-222222222222';
    guard_id UUID := '33333333-3333-3333-3333-333333333333';
    inactive_guard_id UUID := '44444444-4444-4444-4444-444444444444';
    admin_id UUID := '55555555-5555-5555-5555-555555555555';
    result_count INTEGER;
BEGIN
    -- Test 1: User can read their own data
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.users WHERE id = test_user_id;
        
        RETURN QUERY SELECT 
            'User reads own data'::TEXT,
            '1'::TEXT,
            result_count::TEXT,
            (result_count = 1)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User reads own data'::TEXT,
            '1'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 2: User cannot read other user's data
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.users WHERE id = other_user_id;
        
        RETURN QUERY SELECT 
            'User cannot read other user data'::TEXT,
            '0'::TEXT,
            result_count::TEXT,
            (result_count = 0)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot read other user data'::TEXT,
            '0'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 3: User can read active guards (public listing)
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.users WHERE role = 'guard' AND is_active = true;
        
        RETURN QUERY SELECT 
            'User can read active guards'::TEXT,
            '1'::TEXT,
            result_count::TEXT,
            (result_count = 1)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can read active guards'::TEXT,
            '1'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 4: User cannot read inactive guards
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.users WHERE id = inactive_guard_id;
        
        RETURN QUERY SELECT 
            'User cannot read inactive guards'::TEXT,
            '0'::TEXT,
            result_count::TEXT,
            (result_count = 0)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot read inactive guards'::TEXT,
            '0'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 5: User cannot update other user's data
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        UPDATE public.users SET full_name = 'Hacked' WHERE id = other_user_id;
        
        RETURN QUERY SELECT 
            'User cannot update other user data'::TEXT,
            '0'::TEXT,
            '0'::TEXT,
            false; -- Should fail
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot update other user data'::TEXT,
            'ERROR'::TEXT,
            'ERROR: ' || SQLERRM,
            true; -- Expected to fail
    END;
    
    -- Test 6: Admin can read all users
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || admin_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.users;
        
        RETURN QUERY SELECT 
            'Admin can read all users'::TEXT,
            '5'::TEXT,
            result_count::TEXT,
            (result_count = 5)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Admin can read all users'::TEXT,
            '5'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Reset JWT claims
    PERFORM set_config('request.jwt.claims', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION security.rls_fuzz_test_guard_ratings()
RETURNS TABLE(test_name TEXT, expected_result TEXT, actual_result TEXT, passed BOOLEAN) AS $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    other_user_id UUID := '22222222-2222-2222-2222-222222222222';
    guard_id UUID := '33333333-3333-3333-3333-333333333333';
    result_count INTEGER;
BEGIN
    -- Test 1: User can read ratings they created
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.guard_ratings WHERE rater_id = test_user_id;
        
        RETURN QUERY SELECT 
            'User can read own ratings'::TEXT,
            '1'::TEXT,
            result_count::TEXT,
            (result_count = 1)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can read own ratings'::TEXT,
            '1'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 2: User can read all ratings for guards (public for listings)
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.guard_ratings WHERE guard_id = guard_id;
        
        RETURN QUERY SELECT 
            'User can read guard ratings'::TEXT,
            '2'::TEXT,
            result_count::TEXT,
            (result_count = 2)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can read guard ratings'::TEXT,
            '2'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 3: User can create rating for themselves
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.guard_ratings (guard_id, rater_id, score, comment)
        VALUES (guard_id, test_user_id, 5, 'Test rating');
        
        RETURN QUERY SELECT 
            'User can create own rating'::TEXT,
            'SUCCESS'::TEXT,
            'SUCCESS'::TEXT,
            true;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can create own rating'::TEXT,
            'SUCCESS'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 4: User cannot create rating for another user
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.guard_ratings (guard_id, rater_id, score, comment)
        VALUES (guard_id, other_user_id, 5, 'Fake rating');
        
        RETURN QUERY SELECT 
            'User cannot create rating for others'::TEXT,
            'ERROR'::TEXT,
            'SUCCESS'::TEXT,
            false; -- Should fail
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot create rating for others'::TEXT,
            'ERROR'::TEXT,
            'ERROR: ' || SQLERRM,
            true; -- Expected to fail
    END;
    
    -- Reset JWT claims
    PERFORM set_config('request.jwt.claims', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION security.rls_fuzz_test_payment_methods()
RETURNS TABLE(test_name TEXT, expected_result TEXT, actual_result TEXT, passed BOOLEAN) AS $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    other_user_id UUID := '22222222-2222-2222-2222-222222222222';
    result_count INTEGER;
BEGIN
    -- Test 1: User can read their own payment methods
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.payment_methods WHERE user_id = test_user_id;
        
        RETURN QUERY SELECT 
            'User can read own payment methods'::TEXT,
            '1'::TEXT,
            result_count::TEXT,
            (result_count = 1)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can read own payment methods'::TEXT,
            '1'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 2: User cannot read other user's payment methods
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.payment_methods WHERE user_id = other_user_id;
        
        RETURN QUERY SELECT 
            'User cannot read other payment methods'::TEXT,
            '0'::TEXT,
            result_count::TEXT,
            (result_count = 0)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot read other payment methods'::TEXT,
            '0'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 3: User can create their own payment method
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.payment_methods (id, user_id, brand, last4, exp_month, exp_year)
        VALUES ('pm_test_fuzz', test_user_id, 'amex', '1234', 10, 2027);
        
        RETURN QUERY SELECT 
            'User can create own payment method'::TEXT,
            'SUCCESS'::TEXT,
            'SUCCESS'::TEXT,
            true;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can create own payment method'::TEXT,
            'SUCCESS'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 4: User cannot create payment method for another user
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.payment_methods (id, user_id, brand, last4, exp_month, exp_year)
        VALUES ('pm_test_fuzz_other', other_user_id, 'amex', '5678', 10, 2027);
        
        RETURN QUERY SELECT 
            'User cannot create payment method for others'::TEXT,
            'ERROR'::TEXT,
            'SUCCESS'::TEXT,
            false; -- Should fail
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot create payment method for others'::TEXT,
            'ERROR'::TEXT,
            'ERROR: ' || SQLERRM,
            true; -- Expected to fail
    END;
    
    -- Reset JWT claims
    PERFORM set_config('request.jwt.claims', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION security.rls_fuzz_test_emergency_contacts()
RETURNS TABLE(test_name TEXT, expected_result TEXT, actual_result TEXT, passed BOOLEAN) AS $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    other_user_id UUID := '22222222-2222-2222-2222-222222222222';
    result_count INTEGER;
BEGIN
    -- Test 1: User can read their own emergency contacts
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.emergency_contacts WHERE user_id = test_user_id;
        
        RETURN QUERY SELECT 
            'User can read own emergency contacts'::TEXT,
            '1'::TEXT,
            result_count::TEXT,
            (result_count = 1)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can read own emergency contacts'::TEXT,
            '1'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 2: User cannot read other user's emergency contacts
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        SELECT COUNT(*) INTO result_count FROM public.emergency_contacts WHERE user_id = other_user_id;
        
        RETURN QUERY SELECT 
            'User cannot read other emergency contacts'::TEXT,
            '0'::TEXT,
            result_count::TEXT,
            (result_count = 0)::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot read other emergency contacts'::TEXT,
            '0'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 3: User can create their own emergency contact
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.emergency_contacts (id, user_id, name, phone, relationship)
        VALUES ('ec_test_fuzz', test_user_id, 'Test Contact', '+1555000000', 'friend');
        
        RETURN QUERY SELECT 
            'User can create own emergency contact'::TEXT,
            'SUCCESS'::TEXT,
            'SUCCESS'::TEXT,
            true;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User can create own emergency contact'::TEXT,
            'SUCCESS'::TEXT,
            'ERROR: ' || SQLERRM,
            false;
    END;
    
    -- Test 4: User cannot create emergency contact for another user
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub":"' || test_user_id || '"}', true);
        INSERT INTO public.emergency_contacts (id, user_id, name, phone, relationship)
        VALUES ('ec_test_fuzz_other', other_user_id, 'Fake Contact', '+1555000001', 'friend');
        
        RETURN QUERY SELECT 
            'User cannot create emergency contact for others'::TEXT,
            'ERROR'::TEXT,
            'SUCCESS'::TEXT,
            false; -- Should fail
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'User cannot create emergency contact for others'::TEXT,
            'ERROR'::TEXT,
            'ERROR: ' || SQLERRM,
            true; -- Expected to fail
    END;
    
    -- Reset JWT claims
    PERFORM set_config('request.jwt.claims', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main fuzz test runner
CREATE OR REPLACE FUNCTION security.run_all_rls_fuzz_tests()
RETURNS TABLE(
    table_name TEXT,
    test_name TEXT,
    expected_result TEXT,
    actual_result TEXT,
    passed BOOLEAN
) AS $$
BEGIN
    -- Run all fuzz tests
    RETURN QUERY
    SELECT 'users'::TEXT, * FROM security.rls_fuzz_test_users()
    UNION ALL
    SELECT 'guard_ratings'::TEXT, * FROM security.rls_fuzz_test_guard_ratings()
    UNION ALL
    SELECT 'payment_methods'::TEXT, * FROM security.rls_fuzz_test_payment_methods()
    UNION ALL
    SELECT 'emergency_contacts'::TEXT, * FROM security.rls_fuzz_test_emergency_contacts();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function
CREATE OR REPLACE FUNCTION security.cleanup_rls_fuzz_test_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up test data
    DELETE FROM public.emergency_contacts WHERE id LIKE 'ec_test_%';
    DELETE FROM public.payment_methods WHERE id LIKE 'pm_test_%';
    DELETE FROM public.guard_ratings WHERE comment = 'Test rating';
    DELETE FROM public.users WHERE id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555'
    );
    
    RAISE NOTICE 'RLS fuzz test data cleaned up';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





