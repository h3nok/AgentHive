-- Create a Snowflake stored procedure to interface with Cortex for NLQ
-- This is a stub that you would customize based on your Snowflake Cortex setup
-- Prerequisites: Snowflake account with Cortex access and appropriate permissions

-- Create a stored procedure to wrap Cortex NLQ functionality
CREATE OR REPLACE PROCEDURE CORTEX_NLQ_TO_SQL(QUERY_TEXT VARCHAR)
RETURNS TABLE (SQL_QUERY VARCHAR, CONFIDENCE FLOAT, TABLES_USED ARRAY, METADATA OBJECT)
LANGUAGE SQL
AS
$$
DECLARE
    -- Variables for storing results
    generated_sql VARCHAR;
    confidence_score FLOAT;
    tables_array ARRAY;
    metadata_obj OBJECT;
    
    -- Replace this with your actual Cortex API call when available
    -- For now, this is a stub that implements basic pattern matching
    query_lower VARCHAR := LOWER(QUERY_TEXT);
BEGIN
    -- Simple pattern matching as a fallback until actual Cortex APIs are integrated
    -- In a real implementation, you would use Snowflake Cortex functions here
    
    -- AKA Property Owner query
    IF (CONTAINS(query_lower, 'property owner') AND CONTAINS(query_lower, 'aka')) THEN
        -- Extract AKA ID - this is oversimplified for demo
        LET aka_pattern := 'aka\\s+([a-zA-Z0-9]+)';
        LET aka_matches := REGEXP_SUBSTR(query_lower, aka_pattern, 1, 1, 'e');
        LET aka_id := COALESCE(aka_matches, 'AKA123');
        
        generated_sql := 'SELECT owner_name, aka_id, property_id FROM properties WHERE aka_id = ''' || aka_id || '''';
        confidence_score := 0.85;
        tables_array := ARRAY_CONSTRUCT('properties');
        metadata_obj := OBJECT_CONSTRUCT('matched_pattern', 'property_owner');
    
    -- Covenants query
    ELSIF (CONTAINS(query_lower, 'covenants') AND (CONTAINS(query_lower, 'tsc') OR CONTAINS(query_lower, 'pts'))) THEN
        -- Extract store number
        LET store_pattern := 'store\\s+(?:number\\s+)?(\\d+)';
        LET store_matches := REGEXP_SUBSTR(query_lower, store_pattern, 1, 1, 'e');
        LET store_number := COALESCE(store_matches, '101');
        
        -- Determine statuses
        LET statuses_array := ARRAY_CONSTRUCT();
        IF (CONTAINS(query_lower, 'tsc')) THEN
            statuses_array := ARRAY_APPEND(statuses_array, 'TSC');
        END IF;
        IF (CONTAINS(query_lower, 'pts')) THEN
            statuses_array := ARRAY_APPEND(statuses_array, 'PTS');
        END IF;
        
        -- Convert array to string for IN clause
        LET statuses_str := '';
        FOR i IN 0 TO ARRAY_SIZE(statuses_array)-1 DO
            IF (i > 0) THEN
                statuses_str := statuses_str || ', ';
            END IF;
            statuses_str := statuses_str || '''' || statuses_array[i] || '''';
        END FOR;
        
        generated_sql := 'SELECT * FROM covenants WHERE status IN (' || statuses_str || ') AND store_number = ' || store_number;
        confidence_score := 0.82;
        tables_array := ARRAY_CONSTRUCT('covenants');
        metadata_obj := OBJECT_CONSTRUCT('matched_pattern', 'covenants');
    
    -- Disaster Recovery Contacts query
    ELSIF (CONTAINS(query_lower, 'disaster recovery contacts')) THEN
        generated_sql := 'SELECT name, role, phone, email FROM disaster_recovery_contacts';
        confidence_score := 0.90;
        tables_array := ARRAY_CONSTRUCT('disaster_recovery_contacts');
        metadata_obj := OBJECT_CONSTRUCT('matched_pattern', 'disaster_contacts');
    
    -- Lease Expiration query
    ELSIF (CONTAINS(query_lower, 'leases') AND CONTAINS(query_lower, 'expiring')) THEN
        -- Try to extract number of months
        LET months := 12; -- Default
        LET month_pattern := '(\\d+)\\s+months';
        LET month_matches := REGEXP_SUBSTR(query_lower, month_pattern, 1, 1, 'e');
        
        IF (month_matches IS NOT NULL) THEN
            months := TRY_TO_NUMBER(month_matches);
        END IF;
        
        generated_sql := 'SELECT store_number, property_type, base_monthly_rent, expiration_date, leased_area_sqft 
                          FROM leases 
                          WHERE expiration_date IS NOT NULL 
                          AND expiration_date <= DATEADD(month, ' || months || ', CURRENT_DATE()) 
                          ORDER BY expiration_date';
        confidence_score := 0.88;
        tables_array := ARRAY_CONSTRUCT('leases');
        metadata_obj := OBJECT_CONSTRUCT('matched_pattern', 'lease_expiration');
    
    -- Default/unknown query
    ELSE
        generated_sql := '';
        confidence_score := 0.0;
        tables_array := ARRAY_CONSTRUCT();
        metadata_obj := OBJECT_CONSTRUCT('error', 'No matching pattern found for query');
    END IF;
    
    -- Return the results
    RETURN TABLE(SELECT 
        generated_sql AS SQL_QUERY, 
        confidence_score AS CONFIDENCE, 
        tables_array AS TABLES_USED, 
        metadata_obj AS METADATA
    );
END;
$$;

-- Example usage:
-- CALL CORTEX_NLQ_TO_SQL('Who is the current property owner associated with AKA identifier ABC123?');
-- CALL CORTEX_NLQ_TO_SQL('List all covenants with status TSC or PTS for store number 456.');
-- CALL CORTEX_NLQ_TO_SQL('Show all disaster recovery contacts along with their names and roles.');
-- CALL CORTEX_NLQ_TO_SQL('Which leases are expiring within the next 12 months?'); 