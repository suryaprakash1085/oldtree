import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Store,
  Shield,
  Users,
  Zap,
  Lock,
  Globe,
  TrendingUp,
  Settings,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">π</span>
            </div>
            <span className="font-bold text-xl text-slate-900">MultiTenant</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Scale Your SaaS with{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
                Multi-Tenant Power
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              A production-ready platform for managing multiple businesses. Super-admin control,
              client isolation, and customer storefronts—all in one secure system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/signup">
                <Button size="lg" className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>No credit card required</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="space-y-4">
                  <div className="h-3 bg-slate-200 rounded-full w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded-full w-1/2"></div>
                  <div className="space-y-2 pt-4">
                    <div className="h-8 bg-primary/10 rounded-lg"></div>
                    <div className="h-8 bg-primary/10 rounded-lg"></div>
                    <div className="h-8 bg-primary/10 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Components Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Three Powerful Dashboards
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to manage a multi-tenant SaaS platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Super Admin */}
          <div className="group bg-white rounded-xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Super-Admin Panel</h3>
            <p className="text-slate-600 mb-6">
              Full platform control with comprehensive management tools
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                Platform analytics & KPIs
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <Users className="w-4 h-4 text-primary flex-shrink-0" />
                Manage all client accounts
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                Theme management & deployment
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                Billing & subscription control
              </li>
            </ul>
            <Link to="/super-admin">
              <Button variant="outline" className="w-full group">
                Explore
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Client Admin */}
          <div className="group bg-white rounded-xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300 md:scale-105">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Client-Admin Panel</h3>
            <p className="text-slate-600 mb-6">
              Let your clients manage their own business efficiently
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <ShoppingCart className="w-4 h-4 text-primary flex-shrink-0" />
                Product & inventory management
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                Sales & order management
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <Settings className="w-4 h-4 text-primary flex-shrink-0" />
                Store customization & themes
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                Secure data isolation
              </li>
            </ul>
            <Link to="/client-admin/demo">
              <Button className="w-full group">
                Explore
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Storefront */}
          <div className="group bg-white rounded-xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Customer Storefront</h3>
            <p className="text-slate-600 mb-6">
              Beautiful, branded e-commerce sites for your customers
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                Responsive product catalog
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <ShoppingCart className="w-4 h-4 text-primary flex-shrink-0" />
                Shopping cart & checkout
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                Payment processing
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                Order tracking & history
              </li>
            </ul>
            <Link to="/store/demo">
              <Button variant="outline" className="w-full group">
                Explore
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-white rounded-2xl my-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Enterprise-Grade Features
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Complete Data Isolation
                  </h3>
                  <p className="text-slate-600">
                    Each tenant's data is completely isolated with tenant ID separation
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    JWT Authentication with RBAC
                  </h3>
                  <p className="text-slate-600">
                    Role-based access control for super-admin, finance-admin, and support
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    High Performance
                  </h3>
                  <p className="text-slate-600">
                    Optimized to handle 1000+ tenants with consistent performance
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Multi-Language Support
                  </h3>
                  <p className="text-slate-600">
                    Built for English, Tamil, and Hindi with extensible i18n system
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Tenants", value: "1000+" },
                { label: "Users", value: "Unlimited" },
                { label: "Uptime", value: "99.9%" },
                { label: "Latency", value: "<100ms" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl p-6 border border-primary/20"
                >
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600">
            Affordable plans for businesses of any size
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Starter",
              price: "₹1,200",
              period: "per month",
              features: [
                "Up to 5 client stores",
                "Basic analytics",
                "Email support",
                "1 theme included",
              ],
            },
            {
              name: "Growth",
              price: "₹5,000",
              period: "per month",
              features: [
                "Up to 50 client stores",
                "Advanced analytics",
                "Priority support",
                "5 themes included",
                "Custom branding",
              ],
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "contact us",
              features: [
                "Unlimited stores",
                "Custom analytics",
                "Dedicated support",
                "Custom themes",
                "SLA guarantee",
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/50 shadow-xl scale-105"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-slate-600 ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Build Your Platform?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Link to="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-slate-50 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">π</span>
                </div>
                <span className="font-bold">MultiTenant</span>
              </div>
              <p className="text-slate-400 text-sm">
                The secure, scalable multi-tenant SaaS platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 MultiTenant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
