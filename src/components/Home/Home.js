import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

import { Products } from '../Pages/Products';
import { Solutions } from '../Pages/Solutions';
import { Contacts } from '../Pages/Contacts';



export function Home() {
  const features = [
  { id: 1, icon: "/icon1.png", label: "Dashboard" },
  { id: 2, icon: "/icon2.png", label: "Reports & Analytics" },
  { id: 3, icon: "/icon3.png", label: "Custom Forms" },
  { id: 4, icon: "/icon4.png", label: "Document Control" },
  { id: 5, icon: "/icon5.png", label: "Automation & Settings" },
  { id: 6, icon: "/icon1.png", label: "Notifications" }
];


  return (
    <main className="scroll-smooth">
      {/* Hero Section */}
      <section
        className="min-h-screen bg-cover bg-center flex items-center justify-center px-6 py-12"
        style={{ backgroundImage: "url('/image.png')" }} // Ensure this image is placed inside your public folder
      >
        <div className="ui-card bg-white/90 supports-[backdrop-filter]:bg-white/75 backdrop-blur p-8 text-center max-w-5xl shadow-sm min-h-[60vh] w-full">
          
          {/* Improvement System Button */}
          <div className="flex justify-center mb-6">
            <Button variant="ghost" className="bg-white/60 hover:bg-white/80">
              Improvement System
            </Button>
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build a Safer,<br />
            <span className="text-primary">Smarter Workplace</span>
          </h1>

          {/* Call-to-Action Buttons */}
          <div className="flex gap-4 justify-center mb-6">
            <Link to="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Button>Book a Demo</Button>
          </div>

          {/* Feature Icons Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 place-items-center text-center">
            {features.map((feature) => (
              <div key={feature.id} className="flex flex-col items-center p-4">
                <div className="bg-primary2 text-primary p-4 rounded-full text-2xl hover:brightness-95 transition">

                  <img src={feature.icon} alt={feature.label} className="w-8 h-8 cursor-pointer" />
                </div>
                <p className="mt-2 text-sm font-medium  text-gray-700">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scrollable Subsections */}
      <section id="products" className="py-12 px-4 bg-gray-50"><Products /></section>
      <section id="solutions" className="py-12 px-4 bg-white"><Solutions /></section>
      <section id="contacts" className="py-12 px-4 bg-gray-50"><Contacts /></section>
    </main>
  );
}
