import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import filler1 from '../assets/images/filler1.png';

export default function Home({ user }) {
  const navigate = useNavigate();

  const services = [
    {
      title: 'Travel Services',
      description: 'Comprehensive travel planning and relocation support for Ethiopia visits.',
      href: user ? '/travel-form' : '/auth'
    },
    {
      title: 'Business Setup',
      description: 'Professional assistance with business registration and legal requirements.',
      href: user ? '/business-form' : '/auth'
    },
    {
      title: 'Property Services',
      description: 'Find, buy, rent, or manage properties in Ethiopia with expert guidance.',
      href: user ? '/property-form' : '/auth'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-platinum py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl text-charcoal leading-tight">
                Strategic Insights,
                <span className="block text-charcoal">Customized</span>
                <span className="block text-charcoal">Solutions</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-charcoal leading-relaxed max-w-lg font-thin">
                Easily adapt to changes and scale your operations with our flexible 
                infrastructure, designed to support your business growth.
              </p>
              
              <div className="pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="bg-charcoal hover:bg-gray-800 text-white px-8 py-4 text-lg font-thin rounded-lg"
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
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
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-thin text-charcoal mb-6">
              Our Services
            </h2>
            <p className="text-xl text-charcoal font-thin max-w-3xl mx-auto">
              {user 
                ? "Access all your services from your dashboard or get started with a new request below"
                : "Comprehensive support for all your Ethiopian connection needs"
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
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
                  <Button 
                    variant="outline" 
                    className="mt-6 border-charcoal text-charcoal hover:bg-charcoal hover:text-white group-hover:bg-charcoal group-hover:text-white transition-all font-thin"
                  >
                    {user ? 'Access Form' : 'Get Started'}
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
            <h3 className="text-3xl font-thin">ELOS Services</h3>
            <p className="text-timberwolf font-thin text-lg">
              Connecting Ethiopian diaspora with trusted home country services
            </p>
            <div className="pt-8 border-t border-timberwolf">
              <p className="text-sm text-khaki font-thin">
                © 2024 ELOS Services. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}