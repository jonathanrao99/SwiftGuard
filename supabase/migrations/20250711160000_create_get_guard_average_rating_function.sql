
CREATE OR REPLACE FUNCTION get_guard_average_rating(guard_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT AVG(rating) INTO avg_rating
    FROM reviews
    WHERE guard_id = guard_uuid;

    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;
