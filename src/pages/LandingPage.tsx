import React, { useState } from 'react';
import { 
  Shirt, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star,
  Globe,
  BarChart3,
  Palette,
  Camera,
  Brain,
  Sun,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <Camera className="text-indigo-600" size={24} />,
      title: "AI-Powered Virtual Try-On",
      description: "Advanced computer vision technology that accurately maps clothing onto customer photos with realistic fit and draping."
    },
    {
      icon: <Brain className="text-purple-600" size={24} />,
      title: "Smart Style Recommendations",
      description: "Machine learning algorithms analyze customer preferences to suggest personalized clothing combinations and styles."
    },
    {
      icon: <Sun className="text-yellow-600" size={24} />,
      title: "Dynamic Lighting Engine",
      description: "Realistic lighting simulation that shows how garments look in different environments and lighting conditions."
    },
    {
      icon: <BarChart3 className="text-emerald-600" size={24} />,
      title: "Enterprise Analytics",
      description: "Comprehensive dashboard with conversion metrics, user behavior insights, and ROI tracking for data-driven decisions."
    },
    {
      icon: <Palette className="text-pink-600" size={24} />,
      title: "White-Label Customization",
      description: "Fully customizable interface that seamlessly integrates with your brand identity and existing e-commerce platform."
    },
    {
      icon: <Globe className="text-blue-600" size={24} />,
      title: "Multi-Platform Integration",
      description: "Easy integration with Shopify, WooCommerce, Magento, and custom e-commerce solutions via REST API."
    }
  ];

  const stats = [
    { number: "73%", label: "Reduction in Returns", icon: <TrendingUp size={20} /> },
    { number: "2.4x", label: "Increase in Conversion", icon: <Zap size={20} /> },
    { number: "89%", label: "Customer Satisfaction", icon: <Users size={20} /> },
    { number: "99.9%", label: "Uptime Guarantee", icon: <Shield size={20} /> }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "E-commerce Director",
      company: "Fashion Forward",
      content: "VirtualFit transformed our online shopping experience. We saw a 65% reduction in returns and 40% increase in customer engagement within the first month.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO",
      company: "StyleHub",
      content: "The integration was seamless and the analytics provide invaluable insights into customer behavior. Our conversion rates have never been higher.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Brand Manager",
      company: "Urban Threads",
      content: "Our customers love the virtual try-on feature. It's become a key differentiator in our competitive market.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$299",
      period: "/month",
      description: "Perfect for small to medium fashion brands",
      features: [
        "Up to 1,000 try-ons per month",
        "Basic analytics dashboard",
        "Email support",
        "Standard integration",
        "Mobile responsive"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$799",
      period: "/month",
      description: "Ideal for growing fashion retailers",
      features: [
        "Up to 10,000 try-ons per month",
        "Advanced analytics & insights",
        "Priority support",
        "Custom branding",
        "API access",
        "A/B testing tools"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large fashion brands and retailers",
      features: [
        "Unlimited try-ons",
        "Full analytics suite",
        "24/7 dedicated support",
        "White-label solution",
        "Custom integrations",
        "Advanced AI features",
        "Multi-brand management"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shirt className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VirtualFit</h1>
                <p className="text-xs text-gray-600">Enterprise</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#analytics" className="text-gray-600 hover:text-gray-900 transition-colors">Analytics</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="/app" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Try Demo
              </a>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-gray-600">Features</a>
              <a href="#analytics" className="block py-2 text-gray-600">Analytics</a>
              <a href="#pricing" className="block py-2 text-gray-600">Pricing</a>
              <a href="#testimonials" className="block py-2 text-gray-600">Testimonials</a>
              <a href="/app" className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center">
                Try Demo
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="text-indigo-600" size={20} />
                <span className="text-indigo-600 font-medium">AI-Powered Fashion Technology</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your Fashion Business with 
                <span className="text-indigo-600"> Virtual Try-On</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Reduce returns by 73% and increase conversions by 240% with our enterprise-grade virtual try-on solution. 
                Powered by advanced AI and trusted by leading fashion brands worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/app" 
                  className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>Try Live Demo</span>
                  <ArrowRight size={20} />
                </a>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 transition-colors flex items-center justify-center space-x-2">
                  <Play size={20} />
                  <span>Watch Video</span>
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <img 
                  src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600" 
                  alt="Virtual Try-On Demo"
                  className="w-full h-80 object-cover rounded-xl"
                />
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold">
                  Live Demo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to revolutionize your customers' shopping experience and drive business growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section id="analytics" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Powerful Analytics & Insights
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Make data-driven decisions with comprehensive analytics that track every aspect of your virtual try-on performance.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span className="text-gray-700">Real-time conversion tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span className="text-gray-700">Customer behavior heatmaps</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span className="text-gray-700">A/B testing capabilities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span className="text-gray-700">ROI and performance metrics</span>
                </div>
              </div>
              
              <a 
                href="/analytics" 
                className="inline-flex items-center space-x-2 mt-8 text-indigo-600 font-semibold hover:text-indigo-700"
              >
                <span>View Analytics Demo</span>
                <ArrowRight size={16} />
              </a>
            </div>
            
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="bg-gray-100 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Conversion Rate</h3>
                  <span className="text-emerald-600 font-bold">+24%</span>
                </div>
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-end justify-center">
                  <div className="text-white font-bold text-2xl mb-4">73.2%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">12.4K</div>
                  <div className="text-gray-600 text-sm">Try-Ons Today</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">$2.1M</div>
                  <div className="text-gray-600 text-sm">Revenue Impact</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Fashion Brands
            </h2>
            <p className="text-xl text-gray-600">
              See what our enterprise clients are saying about VirtualFit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={16} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  <div className="text-indigo-600 text-sm font-medium">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-2xl shadow-lg p-8 relative ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="text-emerald-500 flex-shrink-0" size={16} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                  plan.popular 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Fashion Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of fashion brands already using VirtualFit to increase conversions and reduce returns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/app" 
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </a>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-indigo-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Shirt className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">VirtualFit</span>
              </div>
              <p className="text-gray-400">
                Enterprise virtual try-on solutions for the fashion industry.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VirtualFit Enterprise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;