import { MuiThemeProvider } from '../../investigacion/components/mui-theme-provider'
import { BoletinesV2Page } from '../../investigacion/components/boletines-v2-page'

export default function NewslettersPage() {
  return (
    <MuiThemeProvider>
      <BoletinesV2Page />
    </MuiThemeProvider>
  )
}
