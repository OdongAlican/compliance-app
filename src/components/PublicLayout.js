import React from "react";
import { ResponsiveMenu } from "./Home/ResponsiveMenu";
import { HomeMenu } from "../mockData/data";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";



export function PublicLayout({ children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Full-width sticky header with shadow */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-6 px-4">

          {/* Logo */}
          <div className="text-2xl flex items-center gap-2 font-bold uppercase">
            <Link to="/" className="navbar-logo text-primary">Compliance-App</Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6 text-gray-600">
              {HomeMenu.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.link}
                    className="inline-block py-1 px-3 hover:text-primary font-semibold"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/Login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/signin">
              <Button>Sign up for free</Button>
            </Link>


          </div>

          {/* Mobile Hamburger Icon */}
          <div className="md:hidden" onClick={() => setOpen(!open)}>
            <span className="text-4xl text-gray-700">&#9776;</span>
          </div>
        </div>

        {/* Mobile Overlay Menu */}
        <ResponsiveMenu open={open} />
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {children}
      </main>
    </>
  );
}












