-- Migrate shipments.carrier from Japanese to code format
UPDATE shipments
SET carrier = CASE
    WHEN carrier = 'ヤマト運輸' THEN 'yamato'
    WHEN carrier = '佐川急便' THEN 'sagawa'
    WHEN carrier = '日本郵便' THEN 'japan_post'
    ELSE carrier  -- Keep as-is if already in code format or unknown
END
WHERE carrier IN ('ヤマト運輸', '佐川急便', '日本郵便');

COMMENT ON COLUMN shipments.carrier IS 'Carrier code: japan_post, yamato, sagawa';
