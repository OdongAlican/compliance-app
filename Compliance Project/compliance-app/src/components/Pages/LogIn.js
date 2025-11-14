import React from 'react';
import { FcGoogle } from 'react-icons/fc';

import {  FaEnvelope, FaLock } from 'react-icons/fa';

export default function LogIn() {
  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg">
      {/* Top Buttons */}
      <div className="flex justify-between mb-6">
        
        <button className="px-6 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-100">
          Log In
        </button>
      </div>

      {/* Header + Google Button */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 text-white flex items-center justify-center text-xl mb-2">
          🔰
        </div>

                <button className="w-full flex items-center justify-center border border-gray-300 rounded-full py-2 mb-4 hover:bg-gray-50 transition">
          <FcGoogle className="text-xl mr-2" />
          Continue with Google
        </button>

      </div>

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative bg-white px-3 text-gray-500 text-sm">OR</div>
      </div>

      {/* Form Fields */}
      <form className="flex flex-col space-y-4">

                <div>
                  <label className="block mb-2 font-medium">Email Address</label>
                  <div className="flex items-center gap-3 border border-gray-300 rounded-full px-4 py-3 bg-gray-50">
                    <FaEnvelope className="text-gray-500" />
                    <input
                      type="email"
                      placeholder="paulamegah@gmail.com"
                      className="w-full bg-transparent outline-none placeholder-gray-500"
                    />
                  </div>
                </div>

        <div>
          <label className="block mb-2 font-medium">Password</label>
           <div className="flex items-center gap-3 border border-gray-300 rounded-full px-4 py-3 bg-gray-50">
            <FaLock />
            <input
              type="password"
              placeholder="PasswordCharacter..@!"
              className="w-full bg-transparent outline-none placeholder-gray-500 "
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-tertiary py-3 rounded-full font-semibold hover:bg-blue-700 mt-6 "
        >
          Create Account
        </button>
      </form>

      {/* Terms & Policy */}
      <p className="text-sm text-gray-600 mt-6 text-center">
        By creating an account you agree to CompanyName’s{' '}
        <a href="#" className="underline text-blue-600">
          Terms & Policy
        </a>
      </p>
    </div>
  );
}
