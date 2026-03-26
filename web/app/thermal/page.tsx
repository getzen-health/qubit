import { ThermalClient } from './thermal-client'

export const metadata = {
  title: 'Thermal Tracker — KQuarks',
  description: 'Track cold plunge, sauna, and contrast therapy sessions. Weekly progress toward Søberg 11 min/week cold target and Laukkanen 57 min/week sauna target.',
}

export default function ThermalPage() {
  return <ThermalClient />
}
