import { MuiThemeProvider } from '../../investigacion/components/mui-theme-provider'
import { GacetasSEMARNATPage } from '../../investigacion/components/gacetas-semarnat-page'

export default function GazettesPage() {
  return (
    <MuiThemeProvider>
      <GacetasSEMARNATPage />
    </MuiThemeProvider>
  )
}
