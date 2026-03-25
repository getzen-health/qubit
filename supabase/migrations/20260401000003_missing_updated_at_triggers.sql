-- meals
CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- daily_nutrition
CREATE TRIGGER update_daily_nutrition_updated_at
    BEFORE UPDATE ON daily_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- fasting_sessions
CREATE TRIGGER update_fasting_sessions_updated_at
    BEFORE UPDATE ON fasting_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_nutrition_settings
CREATE TRIGGER update_user_nutrition_settings_updated_at
    BEFORE UPDATE ON user_nutrition_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- data_access_consents
CREATE TRIGGER update_data_access_consents_updated_at
    BEFORE UPDATE ON data_access_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_preferences
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- push_tokens
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
