import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import HowItWorksSection from '../components/HowItWorksSection'
import UseCasesSection from '../components/UseCasesSection'
import CtaSection from '../components/CtaSection'
import Footer from '../components/Footer'

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <HeroSection />
                <div className="h-divider" />
                <FeaturesSection />
                <div className="h-divider" />
                <HowItWorksSection />
                <div className="h-divider" />
                <UseCasesSection />
                <div className="h-divider" />
                <CtaSection />
            </main>
            <Footer />
        </div>
    )
}
