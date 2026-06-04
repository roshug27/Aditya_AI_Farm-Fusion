import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Instagram, Linkedin, MapPin, Clock, Users, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const ContactSection = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: t('nameRequired'),
        description: t('nameRequiredDesc'),
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: t('invalidEmail'),
        description: t('invalidEmailDesc'),
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.message.trim()) {
      toast({
        title: t('messageRequired'),
        description: t('messageRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate sending message (you can integrate with backend/WhatsApp here)
    setTimeout(() => {
      toast({
        title: t('messageSent'),
        description: t('messageSentDesc'),
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };
  const contacts = [
    {
      type: t('email'),
      icon: Mail,
      items: [
        { label: 'Aastha Bhagat', value: 'aasthaa.99@gmail.com', link: 'mailto:aasthaa.99@gmail.com' },
        { label: 'Roshan Gupta', value: 'roshangupta8179@gmail.com', link: 'mailto:roshangupta8179@gmail.com' }
      ],
      color: 'text-blue-600'
    },
    {
      type: t('phone'),
      icon: Phone,
      items: [
        { label: 'Aastha Bhagat', value: '+91-9152473255', link: 'tel:+919152473255' },
        { label: 'Roshan Gupta', value: '+91-8591331841', link: 'tel:+918591331841' }
      ],
      color: 'text-green-600'
    },
    {
      type: t('socialMedia'),
      icon: Users,
      items: [
        { label: 'Instagram', value: '@aasthaa.bhagat', link: 'https://instagram.com/aasthaa.bhagat', icon: Instagram },
        { label: 'Instagram', value: '@roshu_gupta27', link: 'https://instagram.com/roshu_gupta27', icon: Instagram },
        { label: 'LinkedIn', value: 'Aastha Bhagat', link: 'https://linkedin.com/in/aastha-bhagat', icon: Linkedin },
        { label: 'LinkedIn', value: 'Aditya Gupta', link: 'https://linkedin.com/in/aditya-gupta', icon: Linkedin }
      ],
      color: 'text-purple-600'
    }
  ];

  const supportInfo = [
    {
      emoji: '⏰',
      title: t('supportHours'),
      description: t('supportHoursDesc'),
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      emoji: '📍',
      title: t('location'),
      description: t('locationDesc'),
      icon: MapPin,
      color: 'text-red-600'
    },
    {
      emoji: '💬',
      title: t('responseTime'),
      description: t('responseTimeDesc'),
      icon: MessageCircle,
      color: 'text-blue-600'
    }
  ];

  return (
    <section 
      id="contact" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 floating-animation">
          <div className="text-9xl">📞</div>
        </div>
        <div className="absolute bottom-20 left-10 floating-animation" style={{ animationDelay: '1s' }}>
          <div className="text-7xl">💬</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <MessageCircle className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6">
            📞 {t('contactTitle')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('contactSubtitle')}
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {contacts.map((contactType, index) => (
            <Card 
              key={contactType.type}
              className="border-0 shadow-lg card-float animate-grow-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <contactType.icon className={`${contactType.color}`} size={28} />
                  <h3 className="text-2xl font-bold text-primary">{contactType.type}</h3>
                </div>
                
                <div className="space-y-4">
                  {contactType.items.map((item, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          {item.icon ? (
                            <item.icon className="text-accent" size={16} />
                          ) : (
                            <contactType.icon className={contactType.color} size={16} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">{item.label}</div>
                          <a 
                            href={item.link}
                            className="text-primary hover:text-accent transition-colors duration-300 font-medium group-hover:underline"
                            target={item.link.startsWith('http') ? '_blank' : undefined}
                            rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {item.value}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Support Information */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {supportInfo.map((info, index) => (
            <Card 
              key={info.title}
              className="border-0 shadow-lg text-center card-float animate-bounce-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-6">
                <div className="text-4xl mb-4 floating-animation" style={{ animationDelay: `${index * 0.3}s` }}>
                  {info.emoji}
                </div>
                <info.icon className={`${info.color} mx-auto mb-3`} size={24} />
                <h4 className="text-lg font-bold text-primary mb-2">{info.title}</h4>
                <p className="text-muted-foreground text-sm">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form & FAQ */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Quick Contact Form */}
          <Card className="border-0 shadow-xl animate-grow-in" style={{ animationDelay: '0.5s' }}>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                <MessageCircle className="text-accent" />
                {t('quickMessage')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder={t('yourName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  placeholder={t('yourEmail')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
                <Textarea
                  placeholder={t('yourMessage')}
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  disabled={isSubmitting}
                  className="resize-none"
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Mail className="mr-2" size={16} />
                  {isSubmitting ? t('sending') : t('sendMessage')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="border-0 shadow-xl animate-grow-in" style={{ animationDelay: '0.7s' }}>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                <Users className="text-accent" />
                {t('faq')}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    question: t('faqQ1'),
                    answer: t('faqA1')
                  },
                  {
                    question: t('faqQ2'),
                    answer: t('faqA2')
                  },
                  {
                    question: t('faqQ3'),
                    answer: t('faqA3')
                  },
                  {
                    question: t('faqQ4'),
                    answer: t('faqA4')
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-l-4 border-accent/30 pl-4">
                    <h4 className="font-semibold text-primary mb-1">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animate-fade-slide-right">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <div className="text-4xl mb-4 floating-animation">🌱</div>
              <h3 className="text-2xl font-bold text-primary mb-3">
                {t('growingTogether')}
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('thankYou')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;