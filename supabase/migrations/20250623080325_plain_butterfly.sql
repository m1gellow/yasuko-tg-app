/*
  # Улучшение функции регенерации энергии
  
  1. Изменения
     - Обновление функции regenerate_user_energy с улучшенной логикой
     - Добавление подробного логирования для отладки
     - Проверка существования триггера и его пересоздание при необходимости
  
  2. Улучшения
     - Более точный расчет времени между входами
     - Защита от отрицательных значений времени
     - Пропуск обработки, если last_login не изменился
*/

-- Обновляем функцию регенерации энергии (заменяем старую)
CREATE OR REPLACE FUNCTION regenerate_user_energy()
RETURNS TRIGGER AS $$
DECLARE
    v_regen_rate FLOAT := 0.333; -- 1 энергия каждые 3 минуты
    v_minutes_passed FLOAT;
    v_energy_to_add INTEGER;
BEGIN
    -- Логирование (можно отключить после отладки)
    RAISE LOG '[EnergyRegen] Триггер запущен для пользователя % (старый last_login: %, новый: %)', 
        OLD.id, OLD.last_login, NEW.last_login;
    
    -- Пропускаем если время не изменилось
    IF NEW.last_login IS NULL OR NEW.last_login = OLD.last_login THEN
        RAISE LOG '[EnergyRegen] Пропуск: last_login не изменился';
        RETURN NEW;
    END IF;
    
    -- Вычисляем разницу во времени (с защитой от отрицательных значений)
    v_minutes_passed := GREATEST(EXTRACT(EPOCH FROM (NEW.last_login - OLD.last_login)) / 60, 0);
    
    -- Точный расчет энергии (1 единица за 3 минуты)
    v_energy_to_add := FLOOR(v_minutes_passed * v_regen_rate);
    
    RAISE LOG '[EnergyRegen] Расчет: минут прошло=%, энергии к добавлению=%', 
        v_minutes_passed, v_energy_to_add;
    
    -- Обновляем энергию, если нужно
    IF v_energy_to_add > 0 THEN
        NEW.current_energy := LEAST(
            COALESCE(OLD.current_energy, 100) + v_energy_to_add,
            COALESCE(OLD.max_energy, 100)
        );
        RAISE LOG '[EnergyRegen] Обновлено! Новая энергия=%', NEW.current_energy;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Убедимся, что триггер существует (пересоздаем если нужно)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_regenerate_energy'
    ) THEN
        CREATE TRIGGER trigger_regenerate_energy
        BEFORE UPDATE ON users
        FOR EACH ROW
        WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
        EXECUTE FUNCTION regenerate_user_energy();
        
        RAISE NOTICE 'Триггер trigger_regenerate_energy создан';
    ELSE
        RAISE NOTICE 'Триггер trigger_regenerate_energy уже существует';
    END IF;
END $$;

-- Комментарий к функции для документации
COMMENT ON FUNCTION regenerate_user_energy() IS 
'Улучшенная функция регенерации энергии пользователя при входе в систему (1 единица за 3 минуты)';