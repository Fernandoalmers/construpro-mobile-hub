
-- SQL script to manually fix the referral for profissionalteste@email.com
-- This should be run manually in the Supabase SQL editor

DO $$
DECLARE
    referred_user_id UUID;
    referral_record RECORD;
    points_to_award INTEGER := 50;
BEGIN
    -- Find the user by email
    SELECT id INTO referred_user_id 
    FROM auth.users 
    WHERE email = 'profissionalteste@email.com';
    
    IF referred_user_id IS NULL THEN
        RAISE NOTICE 'User profissionalteste@email.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: %', referred_user_id;
    
    -- Find their pending referral
    SELECT * INTO referral_record
    FROM public.referrals
    WHERE referred_id = referred_user_id AND status = 'pendente';
    
    IF referral_record IS NULL THEN
        RAISE NOTICE 'No pending referral found for this user';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found pending referral: % from referrer: %', referral_record.id, referral_record.referrer_id;
    
    -- Activate the referral
    UPDATE public.referrals
    SET status = 'aprovado',
        data_aprovacao = now(),
        updated_at = now()
    WHERE id = referral_record.id;
    
    -- Award points to referrer
    INSERT INTO public.points_transactions (
        user_id,
        pontos,
        tipo,
        descricao,
        referencia_id
    ) VALUES (
        referral_record.referrer_id,
        points_to_award,
        'indicacao',
        'Pontos por indicação aprovada - correção manual',
        referral_record.id
    );
    
    -- Update referrer balance
    PERFORM public.update_user_points(referral_record.referrer_id, points_to_award);
    
    -- Award points to referred user
    INSERT INTO public.points_transactions (
        user_id,
        pontos,
        tipo,
        descricao,
        referencia_id
    ) VALUES (
        referred_user_id,
        points_to_award,
        'indicacao',
        'Pontos por primeira compra com código de indicação - correção manual',
        referral_record.id
    );
    
    -- Update referred user balance
    PERFORM public.update_user_points(referred_user_id, points_to_award);
    
    RAISE NOTICE 'Referral activation completed successfully';
    RAISE NOTICE 'Awarded % points to referrer: %', points_to_award, referral_record.referrer_id;
    RAISE NOTICE 'Awarded % points to referred user: %', points_to_award, referred_user_id;
    
END $$;
