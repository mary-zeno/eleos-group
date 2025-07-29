import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import filler1 from '../assets/images/filler1.png';

export default function Home({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = [
    {
      title: t('services.travel.title'),
      description: t('services.travel.desc'),
      href: user ? '/travel-form' : '/auth'
    },
    {
      title: t('services.business.title'),
      description: t('services.business.desc'),
      href: user ? '/business-form' : '/auth'
    },
    {
      title: t('services.property.title'),
      description: t('services.property.desc'),
      href: user ? '/property-form' : '/auth'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-timberwolf py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl text-charcoal leading-tight">
                {t('home.hero.title1')}
                <span className="block text-charcoal">{t('home.hero.title2')}</span>
                <span className="block text-charcoal">{t('home.hero.title3')}</span>
              </h1>

              <p className="text-xl lg:text-2xl text-charcoal leading-relaxed max-w-lg font-thin">
                {t('home.hero.description')}
              </p>

              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="bg-charcoal hover:bg-gray-800 text-white px-8 py-4 text-lg font-thin rounded-lg"
                >
                  {user ? t('home.hero.cta.user') : t('home.hero.cta.auth')}
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={filler1}
                  alt="Professional consulting services"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-thin text-charcoal mb-6">
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-charcoal font-thin max-w-3xl mx-auto">
              {user ? t('home.services.desc.user') : t('home.services.desc.auth')}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: t('home.services.travel.title'),
                description: t('home.services.travel.desc'),
                href: user ? '/travel-form' : '/auth'
              },
              {
                title: t('home.services.business.title'),
                description: t('home.services.business.desc'),
                href: user ? '/business-form' : '/auth'
              },
              {
                title: t('home.services.property.title'),
                description: t('home.services.property.desc'),
                href: user ? '/property-form' : '/auth'
              }
            ].map((service, index) => (
              <Card
                key={index}
                className="group text-center p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white"
                onClick={() => navigate(service.href)}
              >
                <CardContent className="space-y-6 p-0">
                  <div className="w-16 h-16 mx-auto bg-charcoal rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-thin">{index + 1}</span>
                  </div>

                  <h3 className="text-2xl font-thin text-charcoal">{service.title}</h3>
                  <p className="text-charcoal font-thin leading-relaxed">{service.description}</p>

                  {/* Translated Button Label */}
                  <Button
                    variant="outline"
                    className="mt-6 border-charcoal text-charcoal hover:bg-charcoal hover:text-white group-hover:bg-charcoal group-hover:text-white transition-all font-thin"
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
      <footer className="bg-charcoal text-white py-16 border-t border-timberwolf">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-thin">{t('home.footer.title')}</h3>
            <p className="text-timberwolf font-thin text-lg">{t('home.footer.tagline')}</p>
            <div className="pt-8 border-t border-timberwolf">
              <p className="text-sm text-khaki font-thin">{t('home.footer.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}