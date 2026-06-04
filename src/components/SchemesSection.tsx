import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, IndianRupee, FileText, Shield, CreditCard } from 'lucide-react';
import schemesImage from '@/assets/schemes.jpg';
import { useLanguage } from '@/hooks/useLanguage';

const SchemesSection = () => {
  const { t } = useLanguage();
  const schemes = [
    {
      title: t('pmKisan'),
      emoji: '💰',
      description: t('pmKisanDesc'),
      benefits: [t('pmKisanBenefit1'), t('pmKisanBenefit2'), t('pmKisanBenefit3')],
      link: 'https://pmkisan.gov.in/',
      icon: IndianRupee,
      color: 'text-green-600'
    },
    {
      title: t('soilHealth'),
      emoji: '🧪',
      description: t('soilHealthDesc'),
      benefits: [t('soilHealthBenefit1'), t('soilHealthBenefit2'), t('soilHealthBenefit3')],
      link: 'https://soilhealth.dac.gov.in/',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: t('pmFasal'),
      emoji: '🌾',
      description: t('pmFasalDesc'),
      benefits: [t('pmFasalBenefit1'), t('pmFasalBenefit2'), t('pmFasalBenefit3')],
      link: 'https://pmfby.gov.in/',
      icon: Shield,
      color: 'text-orange-600'
    },
    {
      title: t('kisanCredit'),
      emoji: '💳',
      description: t('kisanCreditDesc'),
      benefits: [t('kisanCreditBenefit1'), t('kisanCreditBenefit2'), t('kisanCreditBenefit3')],
      link: 'https://financialservices.gov.in/kcc',
      icon: CreditCard,
      color: 'text-purple-600'
    }
  ];

  return (
    <section 
      id="schemes" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 section-bg relative overflow-hidden"
      style={{ backgroundImage: `url(${schemesImage})` }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <FileText className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            📑 {t('schemesTitle')}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {t('schemesSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {schemes.map((scheme, index) => (
            <Card 
              key={scheme.title}
              className="glass-card border-0 card-float group animate-grow-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl floating-animation" style={{ animationDelay: `${index * 0.3}s` }}>
                      {scheme.emoji}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                        {scheme.title}
                      </h3>
                      <scheme.icon className={`${scheme.color} mt-1`} size={20} />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="border-accent/30 hover:border-accent hover:bg-accent/10 transition-all duration-300"
                  >
                    <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                    </a>
                  </Button>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <span className="text-accent">✓</span> {t('keyBenefits')}
                  </h4>
                  <ul className="space-y-2">
                    {scheme.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  asChild
                  className="w-full farm-button group/btn"
                >
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                    <span className="mr-2 group-hover/btn:scale-110 transition-transform duration-300">🚀</span>
                    {t('applyNow')}
                    <ExternalLink className="ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" size={16} />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              emoji: '📞',
              title: t('helplineSupport'),
              description: t('helplineDesc'),
              contact: '1800-180-1551'
            },
            {
              emoji: '🌐',
              title: t('digitalServices'),
              description: t('digitalServicesDesc'),
              contact: 'india.gov.in'
            },
            {
              emoji: '📋',
              title: t('documentation'),
              description: t('documentationDesc'),
              contact: t('downloadGuidelines')
            }
          ].map((info, index) => (
            <Card 
              key={info.title}
              className="glass-card border-0 text-center animate-bounce-in"
              style={{ animationDelay: `${1 + index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="text-3xl mb-3 floating-animation" style={{ animationDelay: `${index * 0.4}s` }}>
                  {info.emoji}
                </div>
                <h4 className="font-bold text-primary mb-2">{info.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                <div className="text-sm font-semibold text-accent">{info.contact}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchemesSection;