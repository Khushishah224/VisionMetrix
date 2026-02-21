import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
    theme: 'dark',
    toggleTheme: () => { },
})

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Restore from localStorage, default dark
        return localStorage.getItem('visionmetrix-theme') || 'dark'
    })

    useEffect(() => {
        // Apply theme to <html> so CSS vars respond
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('visionmetrix-theme', theme)
    }, [theme])

    const toggleTheme = () =>
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
