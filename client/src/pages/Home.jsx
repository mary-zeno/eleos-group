import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// LineDrop component using Tailwind animation
const LineDrop = ({ length = 60, thickness = 2, opacity = 0.2, fallDelay = 0, xPos = 0, speed = 'normal' }) => {
  // Choose animation speed
  const animationClass = speed === 'fast' ? 'animate-fall-fast' : speed === 'slow' ? 'animate-fall-slow' : 'animate-fall';
  
  return (
    <div
      className={`absolute pointer-events-none ${animationClass}`}
      style={{
        left: `${xPos}px`,
        width: `${thickness}px`,
        height: `${length}px`,
        opacity,
        background: 'linear-gradient(to bottom, rgba(126, 63, 23, 0.39), rgba(180,80,20,0.1))',
        borderRadius: '1px',
        boxShadow: '0 0 10px rgba(111, 60, 28, 0.32)',
        animationDelay: `${fallDelay}s`,
      }}
    />
  );
};

// Create drops randomly spread across the whole width
const makeDrops = (count = 40, width = typeof window !== 'undefined' ? window.innerWidth : 1200) => {
  const drops = [];
  const speeds = ['fast', 'normal', 'slow'];
  
  for (let i = 0; i < count; i++) {
    drops.push({
      id: i,
      length: 30 + Math.random() * 50,
      thickness: 1 + Math.random() * 2,
      opacity: 0.01 + Math.random() * 0.05, // Much more translucent
      fallDelay: Math.random() * 15, // Longer delays between drops
      xPos: Math.random() * width,
      speed: speeds[Math.floor(Math.random() * speeds.length)],
    });
  }
  return drops;
};

export default function Home({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Generate drops once - fewer drops for sparser effect
  const drops = makeDrops(40);

  const services = [
    {
      title: t('Travel Services'),
      description: t('Comprehensive travel planning and relocaiton support for Ethiopia visits.'),
      href: user ? '/travel-form' : '/auth',
    },
    {
      title: t('Business Setup'),
      description: t('Professional assistance with business registration and legal requirements.'),
      href: user ? '/business-form' : '/auth',
    },
    {
      title: t('Property Services'),
      description: t('Find, buy, rent, or manage properties in Ethiopia with expert guidance.'),
      href: user ? '/property-form' : '/auth',
    },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Hero Section with Digital Rain */}
      <section className="relative bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-black py-32 lg:py-48 min-h-screen flex items-center justify-center overflow-hidden">
        {/* Digital Rain Effect - only in hero section */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {drops.map((drop) => (
            <LineDrop
              key={drop.id}
              length={drop.length}
              thickness={drop.thickness}
              opacity={drop.opacity}
              fallDelay={drop.fallDelay}
              xPos={drop.xPos}
              speed={drop.speed}
            />
          ))}
        </div>

        {/* Hero Content - above rain */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-7xl xl:text-8xl leading-tight font-light">
              <span className="text-accent font-medium drop-shadow-[0_0_15px_rgba(255,140,0,0.5)] animate-[pulse_4s_ease-in-out_infinite]">
                {t('home.hero.title1')}
              </span>
              <span className="block drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] italic">{t('home.hero.title2')}</span>
              <span className="block drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{t('home.hero.title3')}</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-light">
              {t('home.hero.description')}
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent/20 hover:border-accent/40 hover:text-white transition-all duration-300 px-12 py-6 text-xl font-light rounded-full shadow-lg hover:shadow-xl hover:shadow-accent/25"
              >
                {user ? t('home.hero.cta.user') : t('home.hero.cta.auth')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-charcoal-900 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-white mb-6">{t('home.services.title')}</h2>
            <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto">
              {user ? t('home.services.desc.user') : t('home.services.desc.auth')}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group text-center p-8 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 cursor-pointer border border-gray-800 shadow-lg bg-charcoal-800 hover:bg-charcoal-700"
                onClick={() => navigate(service.href)}
              >
                <CardContent className="space-y-6 p-0">
                  <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                    <span className="text-black text-xl font-medium">{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-light text-white">{service.title}</h3>
                  <p className="text-gray-300 font-light leading-relaxed">{service.description}</p>
                  <Button
                    variant="outline"
                    className="mt-6 border-accent text-accent hover:bg-accent hover:text-black group-hover:bg-accent group-hover:text-black transition-all font-light"
                  >
                    {user ? t('home.services.card.user') : t('home.services.card.auth')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 border-t border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-light">{t('home.footer.title')}</h3>
            <p className="text-gray-300 font-light text-lg">{t('home.footer.tagline')}</p>
            <div className="pt-8 border-t border-gray-800">
              <p className="text-sm text-accent font-light">{t('home.footer.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-30 flex space-x-4">
        <button className="bg-white text-black rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
        <button className="bg-charcoal-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}