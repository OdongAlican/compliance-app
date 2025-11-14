import React from 'react';
import { FcGoogle } from 'react-icons/fc';

import {  FaEnvelope, FaLock } from 'react-icons/fa';

export default function SignIn() {
  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg">
      {/* Top Buttons */}
        <div className="flex justify-center space-x-6 mb-6">
    <span className="text-gray-800 border-b-2 border-gray-800 pb-1 cursor-pointer ">Register</span>
    <span className="text-gray-400 cursor-pointer ">Log In</span>
  </div>


      {/* Header + Google Button */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 text-white flex items-center justify-center text-xl mb-2">
          🔰
        </div>
        <h2 className="text-xl font-semibold mb-4">Create your account</h2>

                <button className="w-full flex items-center justify-center border border-gray-300 rounded-full py-2 mb-14 hover:bg-gray-50 transition">
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

      <form className="flex flex-col space-y-6">
  <div className="grid grid-cols-2 gap-6">
    <div>
      <label className="block mb-2 font-medium">First Name</label>
      <input
        type="text"
        placeholder="Paul"
        className="w-full bg-gray-50 border border-gray-300 rounded-full px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <div>
      <label className="block mb-2 font-medium">Last Name</label>
      <input
        type="text"
        placeholder="Paul"
        className="w-full bg-gray-50 border border-gray-300 rounded-full px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  {/* Email */}
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

  {/* Passwords */}
  {[1, 2].map((i) => (
    <div key={i}>
      <label className="block mb-2 font-medium">{i === 1 ? 'Password' : 'Repeat Password'}</label>
      <div className="flex items-center gap-3 border border-gray-300 rounded-full px-4 py-3 bg-gray-50">
        <FaLock className="text-gray-500" />
        <input
          type="password"
          placeholder="PasswordCharacter..@!"
          className="w-full bg-transparent outline-none placeholder-gray-500 "
        />
      </div>
    </div>
  ))}

  <button
    type="submit"
    className="w-full bg-primary text-tertiary py-3 rounded-full font-semibold hover:bg-indigo-700 transition mt-4"
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
