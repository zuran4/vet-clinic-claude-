import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vetty — Σύστημα Διαχείρισης Κτηνιατρείου',
  description: 'Το πλήρες σύστημα διαχείρισης για το κτηνιατρείο σας. Ραντεβού, ιατρικοί φάκελοι, πελάτες και ζώα — όλα σε ένα μέρος.',
  keywords: 'κτηνιατρείο, διαχείριση, ραντεβού, ιατρικοί φάκελοι, vet software, vetty',
  openGraph: {
    title: 'Vetty — Σύστημα Διαχείρισης Κτηνιατρείου',
    description: 'Το πλήρες σύστημα διαχείρισης για το κτηνιατρείο σας.',
    url: 'https://vetty.gr',
    siteName: 'Vetty',
    locale: 'el_GR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
