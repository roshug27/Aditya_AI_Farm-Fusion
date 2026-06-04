import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, BookOpen, Video, Users, Award } from 'lucide-react';
import tutorialsImage from '@/assets/tutorials.jpg';
import { useLanguage } from '@/hooks/useLanguage';

const TutorialsSection = () => {
  const { t } = useLanguage();
  const tutorials = [
    {
      title: t('modernFarming'),
      emoji: '🚜',
      description: t('modernFarmingDesc'),
      type: t('videoCourse'),
      duration: '1.0 hours',
      level: t('intermediate'),
      link: 'https://youtu.be/heTxEsrPVdQ?si=XHUp6-wOW-Qu22va',
      icon: Video,
      color: 'text-red-600'
    },
    {
      title: t('cropCultivation'),
      emoji: '📹',
      description: t('cropCultivationDesc'),
      type: t('videoSeries'),
      duration: '30.0 minutes',
      level: t('beginner'),
      link: 'https://youtu.be/r9p8ilq0sOQ?si=zdFIMXwKicuATQ55',
      icon: Play,
      color: 'text-blue-600'
    },
    {
      title: t('icarResearch'),
      emoji: '🌱',
      description: t('icarResearchDesc'),
      type: t('researchPortal'),
      duration: t('selfPaced'),
      level: t('advanced'),
      link: 'https://icar.org.in/',
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: t('ministryGuidelines'),
      emoji: '📑',
      description: t('ministryGuidelinesDesc'),
      type: t('documentationType'),
      duration: t('reference'),
      level: t('allLevels'),
      link: 'https://agricoop.gov.in/',
      icon: Award,
      color: 'text-purple-600'
    }
  ];

  const learningPaths = [
    {
      emoji: '🌱',
      title: t('beginnerFarmer'),
      description: t('beginnerDesc'),
      modules: [t('basicFarming'), t('soilBasics'), t('cropSelection')]
    },
    {
      emoji: '🚀',
      title: t('advancedTechniques'),
      description: t('advancedDesc'),
      modules: [t('precisionFarming'), t('iotAgriculture'), t('dataAnalytics')]
    },
    {
      emoji: '💼',
      title: t('agriBusiness'),
      description: t('agriBusinessDesc'),
      modules: [t('marketAnalysis'), t('supplyChain'), t('financialPlanning')]
    }
  ];

  return (
    <section 
      id="tutorials" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 section-bg relative overflow-hidden"
      style={{ backgroundImage: `url(${tutorialsImage})` }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <BookOpen className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            📚 {t('tutorialsTitle')}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {t('tutorialsSubtitle')}
          </p>
        </div>

        {/* Featured Tutorials */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {tutorials.map((tutorial, index) => {
            const videoId = tutorial.link.includes('youtube.com') 
              ? new URL(tutorial.link).searchParams.get('v') 
              : null;
            
            return (
              <Card 
                key={tutorial.title}
                className="glass-card border-0 card-float group animate-grow-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl floating-animation" style={{ animationDelay: `${index * 0.3}s` }}>
                        {tutorial.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                          {tutorial.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <tutorial.icon className={tutorial.color} size={16} />
                          <span className="text-sm text-muted-foreground">{tutorial.type}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="border-accent/30 hover:border-accent hover:bg-accent/10 transition-all duration-300"
                    >
                      <a href={tutorial.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  </div>

                  {videoId && (
                    <div className="mb-6 rounded-lg overflow-hidden aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={tutorial.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {tutorial.description}
                  </p>

                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-accent">⏱️</span>
                      <span className="text-muted-foreground">{tutorial.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-accent">📊</span>
                      <span className="text-muted-foreground">{tutorial.level}</span>
                    </div>
                  </div>

                  <Button 
                    asChild
                    className="w-full farm-button group/btn"
                  >
                    <a href={tutorial.link} target="_blank" rel="noopener noreferrer">
                      <Play className="mr-2 group-hover/btn:scale-110 transition-transform duration-300" size={16} />
                      {t('startLearning')}
                      <ExternalLink className="ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" size={16} />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Learning Paths */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-white text-center mb-8 animate-fade-slide-right">
            🎯 {t('learningPaths')}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {learningPaths.map((path, index) => (
              <Card 
                key={path.title}
                className="glass-card border-0 card-float animate-bounce-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 floating-animation" style={{ animationDelay: `${index * 0.3}s` }}>
                    {path.emoji}
                  </div>
                  <h4 className="text-xl font-bold text-primary mb-2">{path.title}</h4>
                  <p className="text-muted-foreground mb-4">{path.description}</p>
                  <div className="space-y-2">
                    {path.modules.map((module, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <span className="text-muted-foreground">{module}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { emoji: '📚', number: '500+', label: t('tutorialsCount') },
            { emoji: '👨‍🎓', number: '50K+', label: t('learnersCount') },
            { emoji: '🏆', number: '25+', label: t('expertsCount') },
            { emoji: '🌟', number: '4.8', label: t('rating') },
          ].map((stat, index) => (
            <Card 
              key={stat.label}
              className="glass-card border-0 text-center animate-grow-in"
              style={{ animationDelay: `${1.5 + index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="text-3xl mb-2 floating-animation" style={{ animationDelay: `${index * 0.4}s` }}>
                  {stat.emoji}
                </div>
                <div className="text-2xl font-bold text-harvest-gradient">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TutorialsSection;