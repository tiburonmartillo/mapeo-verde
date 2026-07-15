import { ThemeProvider, createTheme } from '@mui/material'
import { CssBaseline } from '@mui/material'

const theme = createTheme({
  palette: {
    primary: { main: '#2C1654' },
    secondary: { main: '#E8772E' },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
})

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
