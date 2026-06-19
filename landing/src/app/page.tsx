import Link from 'next/link'

const APP_URL = 'https://app.vetty.gr'

const features = [
  {
    icon: '📅',
    title: 'Διαχείριση Ραντεβού',
    description: 'Εύκολη προγραμματισμός και παρακολούθηση ραντεβού. Αυτόματες υπενθυμίσεις για πελάτες και ιατρούς.',
  },
  {
    icon: '📋',
    title: 'Ιατρικοί Φάκελοι',
    description: 'Πλήρες ιστορικό για κάθε ζώο. Διαγνώσεις, θεραπείες, εμβόλια και αποτελέσματα εξετάσεων σε ένα μέρος.',
  },
  {
    icon: '🐾',
    title: 'Διαχείριση Ζώων',
    description: 'Λεπτομερής καρτέλα για κάθε κατοικίδιο με φωτογραφία, είδος, ράτσα και ιατρικό ιστορικό.',
  },
  {
    icon: '👥',
    title: 'Βάση Πελατών',
    description: 'Οργανωμένη λίστα ιδιοκτητών με στοιχεία επικοινωνίας και σύνδεση με τα ζώα τους.',
  },
  {
    icon: '📊',
    title: 'Αναφορές & Στατιστικά',
    description: 'Εικόνα της επιχείρησής σας σε πραγματικό χρόνο. Επισκέψεις, έσοδα και τάσεις με ένα κλικ.',
  },
  {
    icon: '🔒',
    title: 'Ασφάλεια & Cloud',
    description: 'Τα δεδομένα σας αποθηκεύονται με κρυπτογράφηση και είναι προσβάσιμα από οποιαδήποτε συσκευή.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '29',
    description: 'Ιδανικό για μικρά κτηνιατρεία',
    features: [
      'Έως 2 χρήστες',
      'Διαχείριση ραντεβού',
      'Ιατρικοί φάκελοι',
      'Βάση πελατών & ζώων',
      'Email υποστήριξη',
    ],
    cta: 'Ξεκινήστε δωρεάν',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '59',
    description: 'Για κτηνιατρεία που αναπτύσσονται',
    features: [
      'Έως 10 χρήστες',
      'Όλα του Starter',
      'Αναφορές & στατιστικά',
      'Αυτόματες υπενθυμίσεις SMS',
      'Προτεραιότητα υποστήριξης',
      'Εξαγωγή δεδομένων (PDF/Excel)',
    ],
    cta: 'Ξεκινήστε δωρεάν',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Για πολλαπλά κτηνιατρεία',
    features: [
      'Απεριόριστοι χρήστες',
      'Όλα του Professional',
      'Multi-location support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA 99.9% uptime',
    ],
    cta: 'Επικοινωνήστε μαζί μας',
    highlighted: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">Vetty</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">beta</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Λειτουργίες</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Τιμές</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors">Επικοινωνία</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`${APP_URL}/login`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Σύνδεση
            </Link>
            <Link
              href={`${APP_URL}/register`}
              className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Δοκιμάστε δωρεάν
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm px-4 py-2 rounded-full font-medium mb-8">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            Νέο: Αυτόματες υπενθυμίσεις ραντεβού
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Το σύστημα που χρειάζεται<br />
            <span className="text-primary-600">κάθε κτηνιατρείο</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ραντεβού, ιατρικοί φάκελοι, διαχείριση πελατών και ζώων — όλα σε ένα απλό και γρήγορο σύστημα.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`${APP_URL}/register`}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg shadow-primary-200"
            >
              Ξεκινήστε δωρεάν — 30 μέρες trial
            </Link>
            <Link
              href={`${APP_URL}/login`}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Έχετε λογαριασμό; Συνδεθείτε
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Χωρίς πιστωτική κάρτα. Ακύρωση οποιαδήποτε στιγμή.</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-medium mb-6">Εμπιστεύονται το Vetty</p>
          <div className="flex flex-wrap justify-center gap-10 text-gray-500">
            {['Κτηνιατρείο Αθηνών', 'Pet Care Θεσσαλονίκη', 'Animal Clinic Πειραιά', 'VetCenter Πάτρα'].map(name => (
              <span key={name} className="text-sm font-medium">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Όλα όσα χρειάζεται το κτηνιατρείο σας
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Σχεδιασμένο από κτηνιάτρους, για κτηνιάτρους. Απλό στη χρήση, ισχυρό στις δυνατότητες.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ξεκινήστε σε 3 λεπτά</h2>
          <p className="text-lg text-gray-500 mb-16">Χωρίς εγκατάσταση, χωρίς τεχνικές γνώσεις.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Δημιουργήστε λογαριασμό', desc: 'Εγγραφείτε δωρεάν με το email σας. 30 μέρες trial χωρίς πιστωτική κάρτα.' },
              { step: '2', title: 'Προσθέστε τους πελάτες σας', desc: 'Εισάγετε τα στοιχεία πελατών και ζώων ή κάντε import από Excel.' },
              { step: '3', title: 'Αρχίστε να δουλεύετε', desc: 'Προγραμματίστε ραντεβού, τηρήστε φακέλους και παρακολουθήστε την επιχείρησή σας.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Απλές, διαφανείς τιμές</h2>
            <p className="text-lg text-gray-500">30 μέρες δωρεάν. Ακύρωση οποιαδήποτε στιγμή.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative flex flex-col ${
                  plan.highlighted
                    ? 'border-primary-500 shadow-xl shadow-primary-100'
                    : 'border-gray-100'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-sm px-4 py-1 rounded-full font-medium">
                    Πιο δημοφιλές
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                  {plan.price ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                      <span className="text-gray-400 mb-1">/μήνα</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">Επικοινωνήστε</div>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-600">
                      <span className="text-primary-500 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price ? `${APP_URL}/register` : '#contact'}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-primary-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Έτοιμοι να ξεκινήσετε;
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Εγγραφείτε σήμερα και δοκιμάστε το Vetty δωρεάν για 30 μέρες.
          </p>
          <Link
            href={`${APP_URL}/register`}
            className="inline-block bg-white hover:bg-gray-50 text-primary-700 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            Ξεκινήστε δωρεάν →
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Επικοινωνία</h2>
          <p className="text-gray-500 mb-8">
            Έχετε ερωτήσεις; Είμαστε εδώ να βοηθήσουμε.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4 text-left">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-xl">📧</span>
              <a href="mailto:info@vetty.gr" className="hover:text-primary-600 transition-colors">info@vetty.gr</a>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-xl">📞</span>
              <span>+30 210 000 0000</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-xl">🕐</span>
              <span>Δευτ–Παρ, 09:00–18:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="font-semibold text-gray-600">Vetty</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Πολιτική Απορρήτου</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Όροι Χρήσης</Link>
            <a href="mailto:info@vetty.gr" className="hover:text-gray-600 transition-colors">Επικοινωνία</a>
          </div>
          <div>© {new Date().getFullYear()} Vetty. Με επιφύλαξη παντός δικαιώματος.</div>
        </div>
      </footer>
    </div>
  )
}
