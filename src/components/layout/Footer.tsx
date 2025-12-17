import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>Ì</span>
              </div>
              <span className="font-bold text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>Ìsọ̀ Àrọbọ̀</span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Your premium marketplace for quality products. Discover excellence in every purchase.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-10 h-10 bg-muted/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-muted/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-muted/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-5 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Quick Links</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link to="/products" className="hover:text-background transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-background transition-colors">Categories</Link></li>
              <li><Link to="/cart" className="hover:text-background transition-colors">Shopping Cart</Link></li>
              <li><Link to="/orders" className="hover:text-background transition-colors">My Orders</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-5 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Customer Service</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><a href="#" className="hover:text-background transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Contact Us</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <span>hello@isoarobo.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4" />
                </div>
                <span>+234 (0) 123-4567</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>123 Market Street<br />Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted/20 mt-12 pt-8 text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} Ìsọ̀ Àrọbọ̀. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
