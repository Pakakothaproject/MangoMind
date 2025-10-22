import { useState, useEffect, useCallback } from 'react';

// A custom event to notify of storage changes within the same window.
const dispatchStorageEvent = (key: string, newValue: string | null) => {
  window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, newValue } }));
};

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have the same API as useState
            setStoredValue(prevValue => {
                const valueToStore = value instanceof Function ? value(prevValue) : value;
                const stringifiedValue = JSON.stringify(valueToStore);
                window.localStorage.setItem(key, stringifiedValue);
                dispatchStorageEvent(key, stringifiedValue); // Dispatch custom event for same-page sync
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key]);
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent | CustomEvent) => {
            const eventKey = 'key' in e ? e.key : (e as CustomEvent).detail.key;
            if (eventKey === key) {
                try {
                    const item = window.localStorage.getItem(key);
                    if (item !== null) {
                        setStoredValue(JSON.parse(item));
                    } else {
                        setStoredValue(initialValue);
                    }
                } catch (error) {
                    console.error(`Error parsing localStorage key “${key}” on change:`, error);
                }
            }
        };

        // Listen to standard storage event (for other tabs)
        window.addEventListener('storage', handleStorageChange);
        // Listen to custom storage event (for same tab)
        window.addEventListener('local-storage', handleStorageChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage', handleStorageChange as EventListener);
        };
    }, [key, initialValue]);

    return [storedValue, setValue];
}

export default useLocalStorage;
