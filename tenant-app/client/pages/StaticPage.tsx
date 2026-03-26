import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from '@/lib/utils';
import { getPageBySlug, getContactUs, getPaymentInfo, getStorefrontConfig } from '@/lib/api';
import { ChevronLeft, Share2, Phone, Mail, MapPin, Clock, CreditCard, DollarSign } from 'lucide-react';
import ThemeCHeader from '@/components/ThemeCHeader';

export default function StaticPage() {
  const { slug } = useParams();
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const navigate = useNavigate();
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<any | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any | null>(null);
  const [tenantName, setTenantName] = useState(defaultTenantName);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!slug) return;

        // Load business config
        try {
          const config = await getStorefrontConfig(tenantId);
          if (config?.theme?.companyName) {
            setTenantName(config.theme.companyName);
          }
          if (config?.theme?.logo) {
            const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
            const logoUrl = config.theme.logo;
            const absoluteLogoUrl = /^https?:\/\//i.test(logoUrl) ? logoUrl : `${API_HOST}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
            setTenantLogo(absoluteLogoUrl);
          }
        } catch (err) {
          console.warn("Could not load business details:", err);
        }

        // Handle special virtual pages
        let p: any;
        if (slug === 'contact' || slug === 'payment-info') {
          p = { title: slug === 'contact' ? 'Contact Us' : 'Payment Information', slug: slug };
          setPage(p);
        } else {
          p = await getPageBySlug(tenantId, slug);
          setPage(p);
        }

        const title = p?.seo_title || p?.title || `${tenantName}`;
        const description = p?.seo_description || p?.description || '';
        document.title = title;

        const setMeta = (name: string, content?: string) => {
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
          if (content) el.setAttribute('content', content);
        };
        const setProp = (prop: string, content?: string) => {
          let el = document.querySelector(`meta[property="${prop}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
          if (content) el.setAttribute('content', content);
        };

        setMeta('description', description);
        setMeta('keywords', p?.seo_keywords || '');
        setProp('og:title', title);
        setProp('og:description', description);
        if (p?.featured_image_url) setProp('og:image', p.featured_image_url);

        let linkCanon: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
        if (!linkCanon) { linkCanon = document.createElement('link'); linkCanon.rel = 'canonical'; document.head.appendChild(linkCanon); }
        linkCanon.href = window.location.href;

        // JSON-LD WebPage
        try {
          const existing = document.getElementById('jsonld-webpage');
          if (existing) existing.remove();
          const ld = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: p?.title,
            description: description || undefined,
            url: window.location.href,
            publisher: {
              "@type": "Organization",
              name: tenantName
            },
            mainEntity: {
              "@type": "Thing",
              name: p?.title,
            }
          };
          const s = document.createElement('script');
          s.type = 'application/ld+json';
          s.id = 'jsonld-webpage';
          s.text = JSON.stringify(ld);
          document.head.appendChild(s);
        } catch {}

        // If contact page, fetch contact info
        if (slug === 'contact') {
          try {
            const contactData = await getContactUs(tenantId);
            if (contactData && (contactData.email || contactData.phone || contactData.address)) {
              setContactInfo(contactData);
            }
          } catch (err) {
            console.warn('Could not load contact info:', err);
          }
        }

        // If payment-info page, fetch payment info
        if (slug === 'payment-info') {
          try {
            const paymentData = await getPaymentInfo(tenantId);
            if (paymentData) {
              setPaymentInfo(paymentData);
            }
          } catch (err) {
            console.warn('Could not load payment info:', err);
          }
        }
      } catch (e) {
        toast.error('Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId, tenantName, slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <ThemeCHeader
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        cartSize={0}
        wishlistSize={0}
        onSearchClick={() => setShowSearchModal(true)}
        onWishlistClick={() => setShowWishlistModal(true)}
        onCheckout={() => navigate('/checkout')}
        priceListUrl={priceListUrl}
        showContactUs={slug !== 'contact'}
        showPaymentInfo={slug !== 'payment-info'}
      />

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading page...</p>
            </div>
          ) : !page ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg mb-4">Page not found</p>
              <Link to="/" className="text-slate-900 font-semibold hover:text-slate-700">
                Return Home
              </Link>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                <Link to="/" className="hover:text-slate-900">Home</Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">{page.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
                {page.title}
              </h1>

              {/* Description */}
              {page.description && (
                <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                  {page.description}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {page?.featured_image_url && !loading && (
        <section className="bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <img
              src={page.featured_image_url}
              alt={page.title}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
          </div>
        </section>
      )}

      {/* Page Content */}
      {!loading && page && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Share Buttons */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-600">Share:</span>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out: ${page.title}`;
                if (navigator.share) {
                  navigator.share({ title: page.title, text: text, url: url });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {/* Page Body */}
          {page.content && (
            <article className="prose prose-sm max-w-none prose-slate mb-6">
              <div
                className="text-slate-700 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{
                  __html: page.content
                }}
              />
            </article>
          )}

          {/* Contact Information Section */}
          {slug === 'contact' && contactInfo && (contactInfo.email || contactInfo.phone || contactInfo.address) && (
            <div className="contact-info-section mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 text-center">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {contactInfo.email && (
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-slate-100">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <Mail className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-base">Email</h3>
                    <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-800 break-all">
                      {contactInfo.email}
                    </a>
                  </div>
                )}
                {contactInfo.phone && (
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-slate-100">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <Phone className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-base">Phone</h3>
                    <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:text-blue-800">
                      {contactInfo.phone}
                    </a>
                  </div>
                )}
                {contactInfo.address && (
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-slate-100">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <MapPin className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-base">Address</h3>
                    <p className="text-slate-700 text-xs whitespace-pre-line">{contactInfo.address}</p>
                  </div>
                )}
              </div>
              {contactInfo.working_hours && typeof contactInfo.working_hours === 'object' && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                      <Clock className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-2 text-base">Working Hours</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {contactInfo.working_hours.monday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Monday:</span> {contactInfo.working_hours.monday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.tuesday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Tuesday:</span> {contactInfo.working_hours.tuesday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.wednesday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Wednesday:</span> {contactInfo.working_hours.wednesday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.thursday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Thursday:</span> {contactInfo.working_hours.thursday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.friday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Friday:</span> {contactInfo.working_hours.friday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.saturday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Saturday:</span> {contactInfo.working_hours.saturday}</p>
                          </div>
                        )}
                        {contactInfo.working_hours.sunday && (
                          <div>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-900">Sunday:</span> {contactInfo.working_hours.sunday}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Information Section */}
          {slug === 'payment-info' && paymentInfo && (
            <div className="payment-info-section mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 text-center">Payment Methods</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {(paymentInfo.bank_account_name || paymentInfo.bank_account_number || paymentInfo.bank_name || paymentInfo.ifsc_code) && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-blue-50 p-3 flex items-center gap-2">
                      <CreditCard className="text-blue-600" size={20} />
                      <h3 className="font-semibold text-slate-900 text-sm">Bank Transfer</h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {paymentInfo.bank_account_name && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Holder</p>
                          <p className="text-slate-900 font-medium text-sm">{paymentInfo.bank_account_name}</p>
                        </div>
                      )}
                      {paymentInfo.bank_account_number && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Account #</p>
                          <p className="text-slate-900 font-mono font-medium text-sm break-all">{paymentInfo.bank_account_number}</p>
                        </div>
                      )}
                      {paymentInfo.bank_name && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Bank</p>
                          <p className="text-slate-900 text-sm">{paymentInfo.bank_name}</p>
                        </div>
                      )}
                      {paymentInfo.ifsc_code && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">IFSC</p>
                          <p className="text-slate-900 font-mono font-medium text-sm">{paymentInfo.ifsc_code}</p>
                        </div>
                      )}
                      {paymentInfo.branch && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Branch</p>
                          <p className="text-slate-900 text-sm">{paymentInfo.branch}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(paymentInfo.gpay_name || paymentInfo.gpay_number) && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-green-50 p-3 flex items-center gap-2">
                      <DollarSign className="text-green-600" size={20} />
                      <h3 className="font-semibold text-slate-900 text-sm">Google Pay</h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {paymentInfo.gpay_name && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Name</p>
                          <p className="text-slate-900 font-medium text-sm">{paymentInfo.gpay_name}</p>
                        </div>
                      )}
                      {paymentInfo.gpay_number && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Number</p>
                          <p className="text-slate-900 font-mono font-medium text-sm break-all">{paymentInfo.gpay_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(paymentInfo.upi_name || paymentInfo.upi_id) && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-orange-50 p-3 flex items-center gap-2">
                      <DollarSign className="text-orange-600" size={20} />
                      <h3 className="font-semibold text-slate-900 text-sm">UPI</h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {paymentInfo.upi_name && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">Name</p>
                          <p className="text-slate-900 font-medium text-sm">{paymentInfo.upi_name}</p>
                        </div>
                      )}
                      {paymentInfo.upi_id && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 uppercase">UPI ID</p>
                          <p className="text-slate-900 font-mono font-medium text-sm break-all">{paymentInfo.upi_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Payment Method Images Section */}
              {(paymentInfo.upi_image_url || (paymentInfo.images && paymentInfo.images.length > 0)) && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Payment QR Codes & Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Display multiple images */}
                    {paymentInfo.images && paymentInfo.images.length > 0 && paymentInfo.images.map((img: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                        <img
                          src={img.image_url}
                          alt={`Payment method ${idx + 1}`}
                          className="max-w-full max-h-64 rounded"
                        />
                      </div>
                    ))}

                    {/* Display legacy upi_image_url for backward compatibility */}
                    {paymentInfo.upi_image_url && (
                      <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                        <img
                          src={paymentInfo.upi_image_url}
                          alt="UPI QR Code"
                          className="max-w-full max-h-64 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Google Maps Section for Contact Pages */}
          {slug === 'contact' && contactInfo && contactInfo.map_code && (
            <div className="map-section mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Our Location</h2>
              <div
                className="map-container"
                dangerouslySetInnerHTML={{
                  __html: contactInfo.map_code
                }}
              />
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-slate-900 text-white rounded-lg p-4 md:p-6 text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-2">Ready to get started?</h2>
            <p className="text-slate-300 text-sm mb-3 max-w-2xl mx-auto">
              Have questions or want to know more? Feel free to reach out to us.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-semibold text-sm"
            >
              Explore More
            </Link>
          </div>

          {/* Back Link */}
          <div className="text-center pt-3 border-t border-slate-200">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-6 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm">&copy; 2024 {tenantName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
