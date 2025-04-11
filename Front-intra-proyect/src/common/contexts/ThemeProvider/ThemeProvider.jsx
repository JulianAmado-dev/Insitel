import { createContext, useContext, useEffect, useState } from "react"

// Creamos el contexto para el tema
const ThemeProviderContext = createContext({})

export function ThemeProvider({
  children,
  defaultTheme = "light",
  ...props
}) {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Removemos las clases existentes
    root.classList.remove("light", "dark")
    
    // Si el tema es "system", detectamos la preferencia del sistema
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      // También actualiza el atributo data-theme para CSS variables
      root.setAttribute('data-theme', systemTheme)
      return
    }
    
    // Añadimos la clase correspondiente al tema
    root.classList.add(theme)
    // También actualiza el atributo data-theme para CSS variables
    root.setAttribute('data-theme', theme)
  }, [theme])

  // Creamos el valor del contexto
  const value = {
    theme,
    setTheme: (theme) => {
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}